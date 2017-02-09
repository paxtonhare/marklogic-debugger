xdmp:to-json(
  json:to-array(
    let $connected := dbg:connected()
    for $server in xdmp:servers()
    return
      let $o := json:object()
      let $_ := (
        map:put($o, "id", fn:string($server)),
        map:put($o, "name", xdmp:server-name($server)),
        map:put($o, "connected", fn:exists($connected[. = $server]))
      )
      return
        $o
  )
)
