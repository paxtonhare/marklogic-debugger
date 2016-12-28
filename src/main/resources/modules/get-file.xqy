declare variable $serverId external;
declare variable $uri external;

declare variable  $ml-dir := xdmp:filesystem-filepath('.') || '/Modules';

let $modules-db := xdmp:server-modules-database($serverId)
return
  xdmp:invoke-function(function() {
    if (fn:starts-with($uri, "/MarkLogic/")) then
      xdmp:document-get($ml-dir || $uri)
    else
      fn:doc($uri)
  },
  map:new((
    map:entry("isolation", "different-transaction"),
    map:entry("database", $modules-db),
    map:entry("transactionMode", "update-auto-commit")
  )))
