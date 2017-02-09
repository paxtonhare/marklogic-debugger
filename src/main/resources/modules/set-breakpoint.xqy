declare variable $serverId external;
declare variable $uri external;
declare variable $line external;

let $modules-db := xdmp:server-modules-database(xs:unsignedLong($serverId))
return
  let $results := dbg:eval('
    declare variable $uri external;
    declare variable $line external;
    let $request := xdmp:request()
    let $expressions := dbg:line($request, $uri, $line) ! dbg:expr($request, .)
    return
      (($expressions[dbg:line = $line])[1], $expressions[1])[1]/dbg:expr-id/fn:data()
  ',
  (
    xs:QName("uri"), $uri,
    xs:QName("line"), xs:unsignedInt($line)
  ),
  map:new((
    map:entry("modules", $modules-db)
  )))
  let $request := $results[1]
  return
    $results
