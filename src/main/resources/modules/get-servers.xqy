import module namespace admin = "http://marklogic.com/xdmp/admin"
      at "/MarkLogic/admin.xqy";

xdmp:to-json(
  json:to-array(
    let $connected := dbg:connected()
    let $config := admin:get-configuration()
    for $server in xdmp:servers()
    let $name := xdmp:server-name($server)
    let $modules-db :=
      if ($name eq "TaskServer") then ()
      else
        admin:appserver-get-modules-database($config, $server)
    let $server-root :=
      if ($name eq "TaskServer") then ()
      else
        admin:appserver-get-root($config, $server)
    return
      let $o := json:object()
      let $_ := (
        map:put($o, "id", fn:string($server)),
        map:put($o, "name", $name),
        map:put($o, "connected", fn:exists($connected[. = $server])),
        map:put($o, "modulesDb", fn:string($modules-db)),
        map:put($o, "root", $server-root)
      )
      return
        $o
  )
)
