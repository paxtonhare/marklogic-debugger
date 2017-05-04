import module namespace admin = "http://marklogic.com/xdmp/admin"
      at "/MarkLogic/admin.xqy";

let $m := map:map()
let $_ :=
  let $config := admin:get-configuration()
  for $server-id in admin:get-appserver-ids($config)
  let $modules-db := admin:appserver-get-modules-database($config, $server-id)
  let $o := json:object()
  let $existing := map:get($m, fn:string($modules-db))
  return
    if (fn:exists($existing)) then
      json:array-push(map:get($existing, "appserverIds"), $server-id)
    else (
      map:put($o, "id", fn:string($modules-db)),
      map:put($o, "name",
        if ($modules-db eq 0) then
          "FileSystem"
        else
          xdmp:database-name($modules-db)),
      map:put($o, "appserverIds", json:to-array($server-id)),
      map:put($m, fn:string($modules-db), $o)
    )
return
  xdmp:to-json(
    json:to-array(
      for $key in map:keys($m)
      return
        map:get($m, $key)
    )
  )
