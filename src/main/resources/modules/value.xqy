declare variable $requestId external;
declare variable $xquery external;

try {
  dbg:value($requestId, $xquery)
}
catch($e) {
  xdmp:log($e),
  xdmp:rethrow()
}
