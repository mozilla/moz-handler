/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// Based on code in https://bugzilla.mozilla.org/show_bug.cgi?id=1271553.

let self = require('sdk/self');
let { Cc, Ci } = require('chrome');

const HANDLER_NAME = 'moz://a protocol handler';
const PROTOCOL_SCHEME = 'moz';
const URI_TEMPLATE = 'https://mozilla.github.io/moz-handler/?u=%s';

if (self.loadReason === 'install' || self.loadReason === 'enable') {
  let handler = Cc['@mozilla.org/uriloader/web-handler-app;1'].
                createInstance(Ci.nsIWebHandlerApp);
  handler.name = HANDLER_NAME;
  handler.uriTemplate = URI_TEMPLATE;

  let eps = Cc['@mozilla.org/uriloader/external-protocol-service;1'].
            getService(Ci.nsIExternalProtocolService);
  let protoInfo = eps.getProtocolHandlerInfo(PROTOCOL_SCHEME);
  protoInfo.possibleApplicationHandlers.appendElement(handler, false);
  protoInfo.preferredApplicationHandler = handler;
  protoInfo.alwaysAskBeforeHandling = false;

  let hs = Cc['@mozilla.org/uriloader/handler-service;1'].
           getService(Ci.nsIHandlerService);
  hs.store(protoInfo);
}

require('sdk/system/unload').when(function(unloadReason) {
  if (unloadReason === 'disable') {
    let eps = Cc['@mozilla.org/uriloader/external-protocol-service;1'].
              getService(Ci.nsIExternalProtocolService);
    let protoInfo = eps.getProtocolHandlerInfo(PROTOCOL_SCHEME);
    let appHandlers = protoInfo.possibleApplicationHandlers;
    for (let i = 0; i < appHandlers.length; i++) {
      try {
        let handler = appHandlers.queryElementAt(i, Ci.nsIWebHandlerApp);
        if (handler && handler.uriTemplate === URI_TEMPLATE) {
          appHandlers.removeElementAt(i);
          if (protoInfo.preferredApplicationHandler === handler) {
            protoInfo.preferredApplicationHandler = null;
            protoInfo.alwaysAskBeforeHandling = true;
          }
          break;
        }
      } catch (e) { continue; }
    }
    let hs = Cc['@mozilla.org/uriloader/handler-service;1'].
             getService(Ci.nsIHandlerService);
    hs.store(protoInfo);
  }
});
