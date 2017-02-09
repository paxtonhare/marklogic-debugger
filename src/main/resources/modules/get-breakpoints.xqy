declare variable $requestId external;

let $request-id := xs:unsignedLong($requestId)
let $expr := dbg:expr($request-id, dbg:breakpoints($request-id))
let $o := json:object()
let $_ := (
  map:put($o, "uri", $expr/dbg:uri/fn:string()),
  map:put($o, "line", $expr/dbg:line/fn:data()),
  map:put($o, "statement", $expr/dbg:expr-source/fn:string())
)
return
 xdmp:to-json($o)
