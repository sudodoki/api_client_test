# START!
To run this API, you need: 
+ run `npm install` being in API_v2 folder
+ have [mongodb](http://www.mongodb.org/downloads) up & running
+ run `node index` & start the API

# QUERY!
Sample requests: 
+ `curl www.jscacourse.co.vu:3000/version` -> `"2.0"`
+ `curl www.jscacourse.co.vu:3000/user` -> 
  ```[{"avatar":"http://retroavatar.appspot.com/api?name=Dictator","email":null,"login":"Dictator"}]
  ```
+ `curl 'http://www.jscacourse.co.vu:3000/user/me' -H 'SECRET-TOKEN: 530aa73bfd6a7e6825000001' --data 'is_published=true'` -> 
  ```{
    "_id":"530aa73bfd6a7e6825000001",
    "avatar":"http://0.0.0.0:3000/avatars/sudodoki.jpg",
    "email":null,
    "is_published":"true",
    "login":"sudodoki",
    "password":"123"
  }```
+ `curl 'http://www.jscacourse.co.vu:3000/signup' --data 'login=sudodoki&password=123&passwordConfirmation=123'` -> `{"errors":[{"login":"This login is already taken, sorry"}]}`