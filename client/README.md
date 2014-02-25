This right now is a simple html with livereload snippet injected (search for 'document.write' bit) that has static content that might be used to create your SPA. There're also some js components installed via bower (see bower_components part).

1. Create router
2. Be able to sign-in/sign-up user: this requires doing POST request with request body being JSON object that has:
  + for sign-in: 'login', 'password' keys
  + for sign-up: 'login', 'password', 'passwordConfirmation', optional 'email' keys.
to API_URL + '/signin' & API_URL + '/signup'. Save retrieved token to use for further requests.
3. List all users, after querying API_URL + '/user'. Some might have gender specified, some - not, act accordingly, don't be confused, show avatars.
4. List single user, info on whom can be got queryin API_URL + '/user/' + user_id, given you're adding 'SECRET-TOKEN' header to request that you've gotten from sign-in/sign-up.
5. Edit profile info, using POST to API_URL + '/user/me'
6. Upload file to API_URL + '/user/me/avatar'. Can try using some [specific solutions](http://blueimp.github.io/jQuery-File-Upload/angularjs.html).

If something isn't quite as you expected and described in this doc -> consult [API README](https://github.com/sudodoki/api_client_test/tree/master/API_v2) & source code. PRs & issues are welcome.

Small videos to keep your head spinning:
+ [Egghead#27 templateUrl](https://egghead.io/lessons/angularjs-templateurl)
+ [Egghead#29 ng-view](https://egghead.io/lessons/angularjs-ng-view)
+ [Egghead#30 config function](https://egghead.io/lessons/angularjs-the-config-function)
+ [Egghead#31 $routeProvider api](https://egghead.io/lessons/angularjs-routeprovider-api)
+ [Egghead#32 $routeProvider params](https://egghead.io/lessons/angularjs-routeparams)
+ [Egghead#33 redirectTo](https://egghead.io/lessons/angularjs-redirectto)
+ [Egghead#34 promises](https://egghead.io/lessons/angularjs-promises)
+ [Egghead#35 resolve](https://egghead.io/lessons/angularjs-resolve)
+ [Egghead#36 resolve conventions](https://egghead.io/lessons/angularjs-resolve-conventions)
+ [Egghead#37 resolve $routeChangeError](https://egghead.io/lessons/angularjs-resolve-routechangeerror)
+ [Egghead#38 Directive for Route Handling](https://egghead.io/lessons/angularjs-directive-for-route-handling)
+ [Egghead#39 Route Life Cycle](https://egghead.io/lessons/angularjs-route-life-cycle)
+ [Egghead#42 ng-repeat](https://egghead.io/lessons/angularjs-index-event-log)
+ [Egghead#72 $http](https://egghead.io/lessons/angularjs-http)
+ [Egghead#90 $q.all](https://egghead.io/lessons/angularjs-q-all)
+ [Egghead#97 $resource](https://egghead.io/lessons/angularjs-using-resource-for-data-models)
