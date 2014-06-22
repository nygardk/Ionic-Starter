'use strict';

angular.module('app')

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

    .state('intro', {
      url: '/intro',
      templateUrl: 'templates/intro.html',
      controller: 'IntroCtrl'
    })

    .state('test', {
      url: '/test',
      templateUrl: 'templates/test.html'
    })

  $urlRouterProvider.otherwise('/intro');
});
