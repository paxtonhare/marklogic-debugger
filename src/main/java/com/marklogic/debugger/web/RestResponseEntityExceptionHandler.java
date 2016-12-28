package com.marklogic.debugger.web;

import com.marklogic.debugger.errors.InvalidRequestException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@ControllerAdvice
public class RestResponseEntityExceptionHandler extends ResponseEntityExceptionHandler {

	@ExceptionHandler(InvalidRequestException.class)
	protected ResponseEntity<?> handleInvalidRequestId(InvalidRequestException ex, WebRequest request) {
		String bodyOfResponse = "Request ID not found";
		return handleExceptionInternal(ex, bodyOfResponse,
			new HttpHeaders(), HttpStatus.NOT_FOUND, request);
	}
}
