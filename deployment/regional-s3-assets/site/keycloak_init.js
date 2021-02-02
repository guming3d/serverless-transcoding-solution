  window._keycloak = Keycloak({
    "realm": KEYCLOAK_REALM,
    "auth-server-url": KEYCLOAK_URL + '/auth/',
    "clientId": KEYCLOAK_CLIENTID,
    "url": KEYCLOAK_URL + '/auth/',
  });

  window._keycloak.init({
    onLoad: 'login-required'
  })
    .then((authenticated) => {
      if(authenticated) {
        localStorage.setItem('keycloak_token', window._keycloak.token);
        localStorage.setItem('keycloak_clientId', window._keycloak.clientId);
        localStorage.setItem('keycloak_refreshToken', window._keycloak.refreshToken);

        window._keycloak.loadUserInfo().then(userInfo => {
          localStorage.setItem('keycloak_username',userInfo.preferred_username);
          localStorage.setItem('keycloak_useremail',userInfo.email);
        });
      }
      else {
        console.info("failed keycloak authentication");
        window.location.reload();
      }
    })
    .catch(function (error) {
      console.error("Something wrong keycloak authentication");
        console.error("Set the username and token manually");
        console.error("Set the username and token manually");
        console.error("guming debug>>" + error.error_description);
        console.error("guming debug>>" + error.error);
        console.erroe("guming debug>>" + JSON.stringify(error));

        localStorage.setItem('keycloak_token', "token");
        localStorage.setItem('keycloak_clientId', "keycloak-client-id");
        localStorage.setItem('keycloak_refreshToken', 'testToken');
        localStorage.setItem('keycloak_username','test');
        localStorage.setItem('keycloak_useremail','test@amazon.com');
      // window.location.reload();
    });
