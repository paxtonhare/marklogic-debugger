xquery version "1.0-ml";

declare namespace server = "http://marklogic.com/xdmp/status/server";

import module namespace functx = "http://www.functx.com"
  at "/MarkLogic/functx/functx-1.0-nodoc-2007-01.xqy";

declare variable $serverId external;

let $current-request := xdmp:request()
let $a := json:array()
let $_ :=
  for $status in xdmp:server-status(xdmp:host(), xs:unsignedLong($serverId))/server:request-statuses/server:request-status[fn:not(server:request-id = $current-request)]
  let $o := map:new((
    map:entry("server", xdmp:server-name($status/*:server-id)),
    map:entry("host", xdmp:host-name($status/*:host-id)),
    map:entry("modules", if ($status/*:modules = 0) then "FileSystem" else xdmp:database-name($status/*:modules)),
    map:entry("database", if ($status/*:database = 0) then "FileSystem" else xdmp:database-name($status/*:database)),
    for $item in $status/*[fn:not(self::*:server-id or self::*:host-id or self::*:modules or self::*:database)]
    return
      map:entry(functx:words-to-camel-case(fn:replace(fn:local-name($item), "-", " ")), $item/fn:data())
  ))
  return
    json:array-push($a, $o)
return
  xdmp:to-json($a)

