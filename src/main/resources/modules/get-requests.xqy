xquery version "1.0-ml";

declare namespace server = "http://marklogic.com/xdmp/status/server";

import module namespace admin = "http://marklogic.com/xdmp/admin"
      at "/MarkLogic/admin.xqy";

import module namespace functx = "http://www.functx.com"
  at "/MarkLogic/functx/functx-1.0-nodoc-2007-01.xqy";

let $current-request := xdmp:request()
let $a := json:array()
let $_ :=
  let $config := admin:get-configuration()
  for $status in xdmp:server-status(xdmp:host(), xdmp:servers())/server:request-statuses/server:request-status
  let $server-name := xdmp:server-name($status/*:server-id)
  let $modules-db :=
    if ($server-name = "TaskServer") then
      if ($status/*:debugging-status = "attached") then
        try {
          dbg:value($status/*:request-id, "xdmp:modules-database()")
        }
        catch($ex) {()}
      else ()
    else
      admin:appserver-get-modules-database($config, $status/*:server-id)
  let $modules-root :=
    if ($server-name = "TaskServer") then ()
    else
      admin:appserver-get-root($config, $status/*:server-id)
  let $is-expired :=
    if ($status/*:debugging-status = "attached") then
      try {
        dbg:value($status/*:request-id, "()"), fn:false()
      }
      catch($ex) {
        fn:true()
      }
    else fn:false()
  let $o := map:new((
    map:entry("server", $server-name),
    map:entry("serverId", $status/*:server-id/fn:string()),
    map:entry("host", xdmp:host-name($status/*:host-id)),
    map:entry(
      "modules",
      if ($modules-db = 0) then "FileSystem"
      else
        $modules-db ! xdmp:database-name(.)
    ),
    map:entry("database", if ($status/*:database = 0) then "FileSystem" else xdmp:database-name($status/*:database)),
    $modules-root ! map:entry("modulesRoot", .),
    map:entry("isExpired", $is-expired),
    for $item in $status/*[fn:not(self::*:server-id or self::*:host-id or self::*:modules or self::*:database)]
    return
      map:entry(functx:words-to-camel-case(fn:replace(fn:local-name($item), "-", " ")), $item/fn:data())
  ))
  return
    json:array-push($a, $o)
return
  xdmp:to-json($a)

