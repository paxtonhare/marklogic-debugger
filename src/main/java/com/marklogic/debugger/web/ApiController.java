package com.marklogic.debugger.web;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.DatabaseClientFactory.Authentication;
import com.marklogic.client.FailedRequestException;
import com.marklogic.client.ResourceNotFoundException;
import com.marklogic.client.eval.EvalResult;
import com.marklogic.client.eval.EvalResultIterator;
import com.marklogic.client.eval.ServerEvaluationCall;
import com.marklogic.debugger.auth.ConnectionAuthenticationToken;
import com.marklogic.debugger.errors.InvalidRequestException;
import com.marklogic.xcc.*;
import com.marklogic.xcc.exceptions.RequestException;
import com.marklogic.xcc.types.ValueType;
import org.apache.commons.io.IOUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;

@Controller
@RequestMapping("/api")
public class ApiController {

		/**
		 * The UI checks the user's login status via this endpoint.
		 */
		@RequestMapping(value = "/user/status", method = RequestMethod.GET)
		@ResponseBody
		public String userStatus(HttpServletResponse response) {
      org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      response.setContentType("application/json");
      if (auth != null && auth.isAuthenticated()) {
        String username = null;
        if (auth.getPrincipal() instanceof User) {
          username = ((User) auth.getPrincipal()).getUsername();
        } else {
          username = auth.getPrincipal().toString();
        }
        return String.format("{\"authenticated\":true, \"username\":\"%s\"}", username);
      }
      return "{\"authenticated\":false}";
		}

		/**
		 * The UI logs the user out via this endpoint.
		 */
		@RequestMapping(value = "/user/logout", method = RequestMethod.DELETE)
		@ResponseBody
		public String logout() {
      SecurityContextHolder.clearContext();
			return "{\"authenticated\":false}";
		}

	@RequestMapping(value = "/server/status", method = RequestMethod.GET)
	@ResponseBody
	public String serverStatus(@RequestParam String host, @RequestParam int port) {
		boolean result = false;
		try {
			SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
			requestFactory.setConnectTimeout(500);
			ClientHttpRequest request = requestFactory.createRequest(new URI("http://" + host + ":" + port), HttpMethod.HEAD);
			ClientHttpResponse response = request.execute();
			result = true;
		} catch (IOException e) {
			e.printStackTrace();
		} catch (URISyntaxException e) {
			e.printStackTrace();
		}

		return "{\"result\":" + result + "}";
	}

		@RequestMapping(value = "/servers", method = RequestMethod.GET)
		@ResponseBody
		public String getServers() throws InvalidRequestException {
				ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
				return evalQuery(auth, "get-servers.xqy");
		}

		@RequestMapping(value = "/servers/{serverId}/enable", method = RequestMethod.GET)
		@ResponseBody
		public String enableServer(@PathVariable String serverId) throws InvalidRequestException {
				ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
				HashMap<String, String> hm = new HashMap<>();
				hm.put("serverId", serverId);
				return evalQuery(auth, "enable-server.xqy", hm);
		}

		@RequestMapping(value = "/servers/{serverId}", method = RequestMethod.GET)
		@ResponseBody
		public String isServerEnabled(@PathVariable String serverId) throws InvalidRequestException {
			ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
			HashMap<String, String> hm = new HashMap<>();
			hm.put("serverId", serverId);
			return evalQuery(auth, "is-server-enabled.xqy", hm);
		}

		@RequestMapping(value = "/servers/{serverId}/disable", method = RequestMethod.GET)
		@ResponseBody
		public String disableServer(@PathVariable String serverId) throws InvalidRequestException {
				ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
				HashMap<String, String> hm = new HashMap<>();
				hm.put("serverId", serverId);
				return evalQuery(auth, "disable-server.xqy", hm);
		}

		@RequestMapping(value = "/servers/{serverId}/files", method = RequestMethod.GET)
		@ResponseBody
		public String getServerFiles(@PathVariable String serverId) throws InvalidRequestException {
				ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
				HashMap<String, String> hm = new HashMap<>();
				hm.put("serverId", serverId);
				return evalQuery(auth, "get-files.xqy", hm);
		}


	@RequestMapping(value = "/marklogic/files", method = RequestMethod.GET)
	@ResponseBody
	public String getMarkLogicSystemFiles() throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		return evalQuery(auth, "get-marklogic-system-files.xqy", hm);
	}


		@RequestMapping(value = "/servers/{serverId}/file", method = RequestMethod.GET)
		@ResponseBody
		public String getServerFile(@PathVariable String serverId, @RequestParam String uri) throws InvalidRequestException {
				ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
				HashMap<String, String> hm = new HashMap<>();
				hm.put("serverId", serverId);
				hm.put("uri", uri);
				return evalQuery(auth, "get-file.xqy", hm);
		}

		@RequestMapping(value = "/servers/{serverId}/requests", method = RequestMethod.GET)
		@ResponseBody
		public String getRequests(@PathVariable String serverId) throws InvalidRequestException {
			ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
			HashMap<String, String> hm = new HashMap<>();
			hm.put("serverId", serverId);
			return evalQuery(auth, "get-requests.xqy", hm);
		}

	@RequestMapping(value = "/requests/{requestId}/stack", method = RequestMethod.GET)
	@ResponseBody
	public String getStack(@PathVariable String requestId) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("requestId", requestId);
		return evalQuery(auth, "get-stacktrace.xqy", hm);
	}

	@RequestMapping(value = "/requests/{requestId}/step-over", method = RequestMethod.GET)
	@ResponseBody
	public String stepOver(@PathVariable String requestId) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("requestId", requestId);
		return evalQuery(auth, "step-over.xqy", hm);
	}

	@RequestMapping(value = "/requests/{requestId}/step-in", method = RequestMethod.GET)
	@ResponseBody
	public String stepIn(@PathVariable String requestId) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("requestId", requestId);
		return evalQuery(auth, "step-in.xqy", hm);
	}

	@RequestMapping(value = "/requests/{requestId}/step-out", method = RequestMethod.GET)
	@ResponseBody
	public String stepOut(@PathVariable String requestId) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("requestId", requestId);
		return evalQuery(auth, "step-out.xqy", hm);
	}

	@RequestMapping(value = "/requests/{requestId}/continue", method = RequestMethod.GET)
	@ResponseBody
	public String continueExecution(@PathVariable String requestId) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("requestId", requestId);
		return evalQuery(auth, "continue.xqy", hm);
	}

	@RequestMapping(value = "/requests/{requestId}/pause", method = RequestMethod.GET)
	@ResponseBody
	public String pauseRequest(@PathVariable String requestId) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("requestId", requestId);
		return evalQuery(auth, "pause.xqy", hm);
	}

	@RequestMapping(value = "/requests/{requestId}/breakpoints", method = RequestMethod.POST)
	@ResponseBody
	public String setBreakpoints(@PathVariable String requestId, @RequestBody List<Breakpoint> breakpoints) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		for (Breakpoint bp : breakpoints) {
			HashMap<String, String> hm = new HashMap<>();
			hm.put("requestId", requestId);
			hm.put("uri", bp.uri);
			hm.put("line", bp.line);
			evalQuery(auth, "set-breakpoints.xqy", hm);
		}
		return "";
	}

	@RequestMapping(value = "/requests/{requestId}/breakpoints", method = RequestMethod.GET)
	@ResponseBody
	public String getBreakpoints(@PathVariable String requestId) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("requestId", requestId);
		return evalQuery(auth, "set-breakpoints.xqy", hm);
	}

	@RequestMapping(value = "/requests/{requestId}/eval", method = RequestMethod.POST)
	@ResponseBody
	public String evalExpression(@PathVariable String requestId, @RequestBody String xquery) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("xquery", xquery);
		return evalQuery(auth, "eval.xqy", hm);
	}

	@RequestMapping(value = "/requests/{requestId}/value", method = RequestMethod.POST, produces = {MediaType.TEXT_PLAIN_VALUE})
	@ResponseBody
	public String valueExpression(@PathVariable String requestId, @RequestBody String xquery) throws InvalidRequestException {
		ConnectionAuthenticationToken auth = (ConnectionAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
		HashMap<String, String> hm = new HashMap<>();
		hm.put("requestId", requestId);
		hm.put("xquery", xquery);
		return evalQuery(auth, "value.xqy", hm);
	}

		private String getQuery(String resourceName) {
				try {
						InputStream inputStream = AppController.class.getClassLoader().getResourceAsStream("modules/" + resourceName);
						return IOUtils.toString(inputStream);
				}
				catch(IOException e) {
						e.printStackTrace();
						throw new RuntimeException(e);
				}
		}

		private String evalQuery(ConnectionAuthenticationToken auth, String xquery) throws InvalidRequestException {
			return evalQuery(auth, xquery, new HashMap<>());
		}

		private String evalQuery(ConnectionAuthenticationToken auth, String xquery, HashMap<String, String> params) throws InvalidRequestException {
			String result = "";
			if (auth != null) {
				try {
					DatabaseClient client = DatabaseClientFactory.newClient((String)auth.getHostname(), (Integer)auth.getPort(), (String)auth.getPrincipal(), (String)auth.getCredentials(), Authentication.DIGEST);
					String q = getQuery(xquery);
					ServerEvaluationCall sec = client.newServerEval().xquery(q);
					for (String key : params.keySet()) {
						sec.addVariable(key, params.get(key));
					}
					EvalResultIterator it = sec.eval();
					if (it != null && it.hasNext()) {
						EvalResult res = it.next();
						result += res.getString();
					}
				}
				catch(ResourceNotFoundException e) {
					try {
						ContentSource contentSource = ContentSourceFactory.newContentSource((String)auth.getHostname(), (Integer)auth.getPort(), (String)auth.getPrincipal(), (String)auth.getCredentials());
						Session session = contentSource.newSession();
						AdhocQuery adhocQuery = session.newAdhocQuery(getQuery(xquery));
						for (String key : params.keySet()) {
							adhocQuery.setNewVariable(key, ValueType.XS_STRING, params.get(key));
						}
						ResultSequence res = session.submitRequest(adhocQuery);
						result += res.asString();
					} catch (RequestException e1) {
						e1.printStackTrace();
					}
				}
				catch(FailedRequestException e) {
					if (e.getFailedRequest().getMessageCode().equals("DBG-REQUESTRECORD")) {
						throw new InvalidRequestException();
					}
					throw new RuntimeException(e);
				}
				catch(Exception e) {
					e.printStackTrace();
				}
			}
			return result;
		}
}
