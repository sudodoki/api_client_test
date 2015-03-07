# API_TEST

## Prerequisites

+ Node
+ npm
+ [MongoDB](http://docs.mongodb.org/v2.6/installation/)

## Instructions

To run:
```
git clone git@github.com:sudodoki/api_client_test.git api_client_test
cd $_
npm install
npm run seed
npm start
```

To run tests:
```
npm test
```

# QUERY!
Sample requests: 
+ `curl www.jscacourse.co.vu:3000/version` -> `"2.0"`
+ `curl www.jscacourse.co.vu:3000/user` -> 

    ```
      [{"avatar":"http://retroavatar.appspot.com/api?name=Dictator","email":null,"login":"Dictator"}]
    ```

+ `curl 'http://www.jscacourse.co.vu:3000/user/me' -H 'SECRET-TOKEN: 530aa73bfd6a7e6825000001' --data 'is_published=true'` ->

    ```
    {
      "_id":"530aa73bfd6a7e6825000001",
      "avatar":"http://0.0.0.0:3000/avatars/sudodoki.jpg",
      "email":null,
      "is_published":"true",
      "login":"sudodoki",
      "password":"123"
    }
    ```

+ `curl 'http://www.jscacourse.co.vu:3000/signup' --data 'login=sudodoki&password=123&passwordConfirmation=123'` -> 
    ```
      {"errors":[{"login":"This login is already taken, sorry"}]}
    ```