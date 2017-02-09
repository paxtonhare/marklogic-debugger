declare variable $serverId external;

let $o := json:object()
let $_ := map:put($o, "enabled", dbg:connected() = xs:unsignedLong($serverId))
return
  xdmp:to-json($o)
