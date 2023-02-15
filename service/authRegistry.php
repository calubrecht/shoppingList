<?php


// Actually, only do this if need to authenticate something

global $AUTHENTICATORS, $AUTHENTICATORMAP;
$AUTHENTICATORS = [];
$AUTHENTICATORMAP = [];

function registerAuthenticator($authenticator) {
  global $AUTHENTICATORS, $AUTHENTICATORMAP ;
  array_push($AUTHENTICATORS, $authenticator);
  $AUTHENTICATORMAP[$authenticator->getPluginName()] = $authenticator;

}

function getAuthenticators() {
  global $AUTHENTICATORS;
	return $AUTHENTICATORS;
}

function getAuthenticatorForName($pluginName){
  global $AUTHENTICATORMAP ;
  return $AUTHENTICATORMAP[$pluginName];
}

foreach (glob('authPlugins/*.php') as $filename)
{
    include_once($filename);
}
