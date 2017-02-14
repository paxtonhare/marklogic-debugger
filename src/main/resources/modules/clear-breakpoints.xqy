declare variable $requestId external;

let $requestId := xs:unsignedLong($requestId)
for $expression in dbg:breakpoints($requestId)
return
  dbg:clear($requestId, $expression)
