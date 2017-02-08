package com.marklogic.debugger.auth;

import java.util.Collection;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.SpringSecurityCoreVersion;

/**
 * An {@link org.springframework.security.core.Authentication} implementation that is
 * designed for simple presentation of a username and password.
 * <p>
 * The <code>principal</code> and <code>credentials</code> should be set with an
 * <code>Object</code> that provides the respective property via its
 * <code>Object.toString()</code> method. The simplest such <code>Object</code> to use is
 * <code>String</code>.
 *
 * @author Ben Alex
 */
public class ConnectionAuthenticationToken extends AbstractAuthenticationToken {

  private static final long serialVersionUID = SpringSecurityCoreVersion.SERIAL_VERSION_UID;

  // ~ Instance fields
  // ================================================================================================

  private final Object principal;
  private Object credentials;
  private Object hostname;
  private Object port;

  // ~ Constructors
  // ===================================================================================================

  /**
   * This constructor can be safely used by any code that wishes to create a
   * <code>ConnectionAuthenticationToken</code>, as the {@link #isAuthenticated()}
   * will return <code>false</code>.
   *
   */
  public ConnectionAuthenticationToken(Object principal, Object credentials, Object hostname, Object port) {
    super(null);
    this.principal = principal;
    this.credentials = credentials;
    this.hostname = hostname;
    this.port = port;
    setAuthenticated(false);
  }

  /**
   * This constructor should only be used by <code>AuthenticationManager</code> or
   * <code>AuthenticationProvider</code> implementations that are satisfied with
   * producing a trusted (i.e. {@link #isAuthenticated()} = <code>true</code>)
   * authentication token.
   *
   * @param principal
   * @param credentials
   * @param authorities
   */
  public ConnectionAuthenticationToken(Object principal, Object credentials, Object hostname, Object port,
      Collection<? extends GrantedAuthority> authorities) {
    super(authorities);
    this.principal = principal;
    this.credentials = credentials;
    this.hostname = hostname;
    this.port = port;
    super.setAuthenticated(true); // must use super, as we override
  }

  // ~ Methods
  // ========================================================================================================

  public Object getCredentials() {
    return this.credentials;
  }

  public Object getPrincipal() {
    return this.principal;
  }

  public Object getHostname() {
    return this.hostname;
  }

  public Object getPort() { return this.port; }

  public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
    if (isAuthenticated) {
      throw new IllegalArgumentException(
          "Cannot set this token to trusted - use constructor which takes a GrantedAuthority list instead");
    }

    super.setAuthenticated(false);
  }

  @Override
  public void eraseCredentials() {
    super.eraseCredentials();
    credentials = null;
  }
}
