(:declare variable $serverId external;
declare variable $uri external;
declare variable $line external;
:)

declare variable $serverId external;
declare variable $uri external;
declare variable $line external;
(:let $serverId := 12693404844329926599:)

(:let $uri := "/com.marklogic.hub/collectors/query.xqy"
let $line := 36:)
let $modules-db := xdmp:server-modules-database($serverId)
return
  let $results := dbg:eval('
    declare variable $uri external;
    declare variable $line external;
    xdmp:request(),
    dbg:line(xdmp:request(), $uri, $line)
  ',
  (
    xs:QName("uri"), $uri,
    xs:QName("line"), $line
  ),
  map:new((
    map:entry("modules", $modules-db)
  )))
  let $request := $results[1]
  (:let $_ := dbg:continue($request):)
  return
    $results


(:dbg:break($request as xs:unsignedLong, $expression as xs:unsignedLong):)
