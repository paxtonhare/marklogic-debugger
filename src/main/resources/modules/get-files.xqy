declare option xdmp:mapping "false";

declare variable $serverId external;

declare function local:build-files($uris as xs:string+, $parent as xs:string, $a as json:array)
{
  let $parent :=
    if (fn:ends-with($parent, "/")) then $parent
    else
      $parent || "/"
  let $files :=
    fn:distinct-values(
      for $uri in $uris[fn:matches(., "^" || $parent || "[^/]+$")]
      let $file := fn:replace($uri, "^" || $parent || "([^/]+)$", "$1")
      return
        $file
    )
  (:let $_ := xdmp:log(("files:", $files)):)
  for $file in $files
  let $o := json:object()
  let $_ := map:put($o, "name", $file)
  let $_ := map:put($o, "type", "file")
  let $_ := map:put($o, "uri", $parent || $file)
  return
    json:array-push($a, $o)
};

declare function local:build-dirs($uris as xs:string+, $parent as xs:string)
{
  let $parent :=
    if (fn:ends-with($parent, "/")) then $parent
    else
      $parent || "/"
  let $dirs :=
    fn:distinct-values(
      for $uri in $uris[fn:matches(., "^" || $parent || "[^/]+/.*$")]
      let $dir := fn:replace($uri, "^" || $parent || "([^/]+)/.*$", "$1")
      return
        $dir
    )
  let $a := json:array()
  let $_ := local:build-files($uris, $parent, $a)
  let $_ :=
    for $dir in $dirs
    let $o := json:object()
    let $oo := local:build-dirs($uris, $parent || $dir)
    let $_ := local:build-files($uris, $parent || $dir, $oo)
    let $_ := map:put($o, "name", $dir)
    let $_ := map:put($o, "type", "dir")
    let $_ := map:put($o, "children", $oo)
    let $_ := map:put($o, "collapsed", fn:true())
    return
      json:array-push($a, $o)
  return $a
};

let $modules-db := xdmp:server-modules-database($serverId)
let $uris :=
  xdmp:invoke-function(function() {
    for $x in cts:search(fn:doc(), cts:true-query(), "unfiltered")
    let $uri := xdmp:node-uri($x)
    where fn:not(fn:ends-with($uri, "/"))
    order by $uri ascending
    return
      $uri
  },
  map:new((
    map:entry("isolation", "different-transaction"),
    map:entry("database", $modules-db),
    map:entry("transactionMode", "update-auto-commit")
  )))
let $o := json:object()
let $_ := map:put($o, "name", "/")
let $_ := map:put($o, "type", "dir")
let $_ := map:put($o, "children", local:build-dirs($uris, "/"))
return
  $o
