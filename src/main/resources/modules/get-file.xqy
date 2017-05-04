import module namespace admin = "http://marklogic.com/xdmp/admin"
      at "/MarkLogic/admin.xqy";

declare variable $databaseId external;
declare variable $modulesRoot external;

declare variable $uri external;
declare variable  $ml-dir := xdmp:filesystem-filepath('.') || '/Modules';

let $modules-db := xs:unsignedLong($databaseId)
let $modulesRoot :=
  if ($modules-db eq 0) then
    if (fn:matches($uri, "MarkLogic[\\/]Modules")) then $modulesRoot
    else if (fn:starts-with($uri, "/")) then "."
    else "./"
  else
    $modulesRoot
return
  if ($modules-db = 0) then
    if (fn:starts-with($uri, "/MarkLogic/")) then
      xdmp:document-get($ml-dir || $uri)
    else
      xdmp:document-get($modulesRoot || $uri)
  else
    xdmp:invoke-function(function() {
      if (fn:starts-with($uri, "/MarkLogic/")) then
        xdmp:document-get($ml-dir || $uri)
      else
        fn:doc($uri)
    },
    <options xmlns="xdmp:eval">
      <isolation>different-transaction</isolation>
      <database>{$modules-db}</database>
      <transaction-mode>update-auto-commit</transaction-mode>
    </options>)
