json:to-array(
  let $connected := dbg:connected()
  for $server in xdmp:servers()
  return
    object-node {
      "id": fn:string($server),
      "name": xdmp:server-name($server),
      "connected": fn:exists($connected[. = $server])
    }
)
