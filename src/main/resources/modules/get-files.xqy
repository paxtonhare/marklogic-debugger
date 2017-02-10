xquery version "1.0-ml";

import module namespace admin = "http://marklogic.com/xdmp/admin"
      at "/MarkLogic/admin.xqy";

declare option xdmp:mapping "false";

declare variable $serverId external;

declare variable  $ml-dir := xdmp:filesystem-filepath('.') || '/Modules';

declare function local:build-files($uris as xs:string*, $parent as xs:string, $a as json:array)
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
  for $file in $files
  let $o := json:object()
  let $_ := map:put($o, "name", $file)
  let $_ := map:put($o, "type", "file")
  let $_ := map:put($o, "collapsed", fn:true())
  let $_ := map:put($o, "uri", $parent || $file)
  return
    json:array-push($a, $o)
};

declare function local:build-dirs($uris as xs:string*, $parent as xs:string)
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

declare function local:get-system-files($root-dir, $dirs, $a as json:array) {
  for $entry in $dirs/dir:entry[dir:type = "file"]
  let $o := json:object()
  let $_ := map:put($o, "name", fn:string($entry/dir:filename))
  let $_ := map:put($o, "type", "file")
  let $_ := map:put($o, "collapsed", fn:true())
  let $_ := map:put($o, "uri", fn:replace($entry/dir:pathname, $root-dir, ""))
  return
    json:array-push($a, $o)
};

declare function local:get-system-dirs($root-dir, $dirs, $a as json:array) {
  for $entry in $dirs/dir:entry[dir:type = "directory"]
  return
    let $o := json:object()
    let $children :=  json:array()
    let $child-dirs := xdmp:filesystem-directory($entry/dir:pathname)
    let $_ := local:get-system-dirs($root-dir, $child-dirs, $children)
    let $_ := local:get-system-files($root-dir, $child-dirs, $children)
    let $_ := map:put($o, "name", fn:string($entry/dir:filename))
    let $_ := map:put($o, "type", "dir")
    let $_ := map:put($o, "collapsed", fn:true())
    let $_ := map:put($o, "children", $children)
    return
      json:array-push($a, $o)
};

let $server-id := xs:unsignedLong($serverId)
let $config := admin:get-configuration()
let $modules-db := admin:appserver-get-modules-database($config, $server-id)
let $server-root := admin:appserver-get-root($config, $server-id)
let $obj :=
  if ($modules-db = 0) then
    let $o := json:object()
    let $_ := map:put($o, "name", "/")
    let $_ := map:put($o, "type", "dir")
    let $_ := map:put($o, "collapsed", fn:false())
    let $children := json:array()
    let $dirs := xdmp:filesystem-directory($server-root)
    let $_ := local:get-system-dirs($server-root, $dirs, $children)
    let $_ := map:put($o, "children", $children)
    return
      $o
  else
    let $uris :=
      xdmp:invoke-function(function() {
        for $x in cts:search(fn:doc(), cts:and-query(()), "unfiltered")
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
    let $_ := map:put($o, "collapsed", fn:false())
    let $children := local:build-dirs($uris, "/")
    let $_ := map:put($o, "children", $children)
    return
      $o
return
  xdmp:to-json($obj)
