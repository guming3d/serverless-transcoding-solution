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
    .catch(function () {
      console.error("Something wrong keycloak authentication");
      window.location.reload();
    });
