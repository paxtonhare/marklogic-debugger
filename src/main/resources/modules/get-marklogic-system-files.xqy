xquery version "1.0-ml";

declare option xdmp:mapping "false";

declare variable $ml-dir := xdmp:filesystem-filepath('.') || '/Modules';
declare variable $start-dir := $ml-dir || '/MarkLogic';

declare function local:get-system-files($dir as xs:string, $a as json:array) {
  for $entry in xdmp:filesystem-directory($dir)/dir:entry[dir:type = "file"][fn:not(dir:filename = '.DS_Store')]
  let $o := json:object()
  let $_ := map:put($o, "name", fn:string($entry/dir:filename))
  let $_ := map:put($o, "type", "file")
  let $_ := map:put($o, "uri", fn:replace($entry/dir:pathname, $ml-dir, ""))
  return
    json:array-push($a, $o)
};

declare function local:get-system-dirs($dir as xs:string, $a as json:array) {
  for $entry in xdmp:filesystem-directory($dir)/dir:entry[dir:type = "directory"]
  return
    let $o := json:object()
    let $children :=  json:array()
    let $_ := local:get-system-dirs($entry/dir:pathname, $children)
    let $_ := local:get-system-files($entry/dir:pathname, $children)
    let $_ := map:put($o, "name", fn:string($entry/dir:filename))
    let $_ := map:put($o, "type", "dir")
    let $_ := map:put($o, "collapsed", fn:true())
    let $_ := map:put($o, "children", $children)
    return
      json:array-push($a, $o)
};

let $obj :=
  let $o := json:object()
  let $_ := map:put($o, "name", "/MarkLogic")
  let $_ := map:put($o, "type", "dir")
  let $_ := map:put($o, "collapsed", fn:true())
  let $children := json:array()
  let $_ := local:get-system-dirs($start-dir, $children)
  let $_ := local:get-system-files($start-dir, $children)
  let $_ := map:put($o, "children", $children)
  return
    $o
return
  xdmp:to-json($obj)
