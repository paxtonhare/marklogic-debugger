package com.marklogic.debugger.auth;

import com.marklogic.spring.http.RestClient;
import com.marklogic.spring.http.RestConfig;
import com.marklogic.spring.http.SimpleRestConfig;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.Credentials;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.client.HttpClientErrorException;

import java.net.URI;

/**
 * Implements Spring Security's AuthenticationManager interface so that it can authenticate users by making a simple
 * request to MarkLogic and checking for a 401. Also implements AuthenticationProvider so that it can be used with
 * Spring Security's ProviderManager.
 */
public class MarkLogicAuthenticationManager implements AuthenticationProvider, AuthenticationManager {

    private SimpleRestConfig restConfig;

    private String pathToAuthenticateAgainst = "/";

    /**
     * A RestConfig instance is needed so a request can be made to MarkLogic to see if the user can successfully
     * authenticate.
     *
     * @param restConfig
     */
    public MarkLogicAuthenticationManager(RestConfig restConfig) {
        this.restConfig = (SimpleRestConfig)restConfig;
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return ConnectionAuthenticationToken.class.isAssignableFrom(authentication);
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        if (!(authentication instanceof ConnectionAuthenticationToken)) {
            throw new IllegalArgumentException(
                    getClass().getName() + " only supports " + ConnectionAuthenticationToken.class.getName());
        }

        ConnectionAuthenticationToken token = (ConnectionAuthenticationToken) authentication;
        String username = token.getPrincipal().toString();
        String password = token.getCredentials().toString();
        String hostname = token.getHostname().toString();

        if (username == "" || password == "" || hostname == "") {
          throw new BadCredentialsException("Invalid credentials");
        }
        /**
         * For now, building a new RestTemplate each time. This should in general be okay, because we're typically not
         * authenticating users over and over.
         */
        restConfig.setHost(hostname);
        RestClient client = new RestClient(restConfig, new SimpleCredentialsProvider(username, password));
        URI uri = client.buildUri(pathToAuthenticateAgainst, null);
        try {
            client.getRestOperations().getForEntity(uri, String.class);
        } catch (HttpClientErrorException ex) {
            if (HttpStatus.NOT_FOUND.equals(ex.getStatusCode())) {
                // Authenticated, but the path wasn't found - that's okay, we just needed to verify authentication
            } else if (HttpStatus.UNAUTHORIZED.equals(ex.getStatusCode())) {
                throw new BadCredentialsException("Invalid credentials");
            } else {
                throw ex;
            }
        }

        return new ConnectionAuthenticationToken(token.getPrincipal(), token.getCredentials(),
                token.getHostname(), token.getAuthorities());
    }

    public void setPathToAuthenticateAgainst(String pathToAuthenticateAgainst) {
        this.pathToAuthenticateAgainst = pathToAuthenticateAgainst;
    }
}

/**
 * Simple implementation that is good for one-time requests.
 */
class SimpleCredentialsProvider implements CredentialsProvider {

    private String username;
    private String password;

    public SimpleCredentialsProvider(String username, String password) {
        this.username = username;
        this.password = password;
    }

    @Override
    public void setCredentials(AuthScope authscope, Credentials credentials) {
    }

    @Override
    public Credentials getCredentials(AuthScope authscope) {
        return new UsernamePasswordCredentials(username, password);
    }

    @Override
    public void clear() {
    }

}
