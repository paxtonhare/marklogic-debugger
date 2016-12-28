package com.marklogic.debugger;

public class LoginInfo {
	public String username;
	public String password;
	public String hostname;

	public String toString() {
		return "{\"username\":\"" + username + "\"," +
				"\"hostname\": \"" + hostname + "\"}";
	}
}
