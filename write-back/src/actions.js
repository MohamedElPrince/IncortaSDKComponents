import { log } from "console"
import { userInfo } from "os";



export async function handleClick(url, reqType, Params, AccessToken, isMultiUpdates = false) {
  let fullResult, fullError
   var myHeaders = new Headers();
   myHeaders.append("Content-Type", "application/json");
   const tokenFieldName = isMultiUpdates ? "Authorization" : "AccessToken";
   AccessToken && myHeaders.append(tokenFieldName, AccessToken);
   const method = reqType.toLowerCase();

  if (method === 'get') {
    // GET ------------------------------------------------------------------------------------------------------------
      newURL = url;
    
    for(let i=0; i<Params.length; i++) {
      var Param = Params[i];
      if (i == 0)
        newURL += "?";
      else
      newURL += "&";
      newURL += Param[0] + "=" + Param[1];
    }

    var raw = "";
    var requestOptions = {
      method: 'GET',
      redirect: 'follow' ,
      headers: myHeaders
    };

    await fetch(newURL, requestOptions)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          return { error: `${response.status}: NETWORK RESPONSE ERROR`};
        }
      })
      .then(result => {
        console.log(result);
        if (result.error) {
          fullError = {message: result.error};
        } else {
          fullResult = result
        }
      })
      .catch(error => {
        console.log('error', error)
        fullError = error
      })


  } else if (method === 'post') {
    // POST -----------------------------------------------------------------------------------------------------------
     JSONParams = isMultiUpdates ? Params : {};
    
    for(let i=0; i<Params.length; i++) {
      var Param = Params[i];
      JSONParams[Param[0]]=Param[1];
    }

  
  //var user = localStorage.getItem("userObject");
   
    var raw = JSON.stringify(JSONParams);
   
    console.log("raw",raw);
    var requestOptions = {
      method: 'POST',
    // credentials: "include",
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    await fetch(url, requestOptions)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          return { error: `${response.status}: NETWORK RESPONSE ERROR`};
        }
      })
      .then(result => {
        if (result.error) {
          fullError = {message: result.error};
        } else {
          fullResult = result
        }
      })
      .catch(error => {
        fullError = error
        console.log('error', error)
      })
  }

  return {result: fullResult, error: fullError};
}
