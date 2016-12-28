declare variable $requestId external;
declare variable $uri external;
declare variable $line external;

let $expr-id := dbg:line($requestId, $uri, $line)
return
  dbg:break($requestId, $expr-id)
