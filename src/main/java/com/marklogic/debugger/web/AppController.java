package com.marklogic.debugger.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class AppController {

		@RequestMapping(value = {"/", "/login", "/home", "/404"}, method = RequestMethod.GET)
		public String index() {
				return "index";
		}
}
