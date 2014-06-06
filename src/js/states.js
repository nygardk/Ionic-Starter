'use strict';

angular.module('app')

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

    .state('intro', {
      url: '/intro',
      templateUrl: 'templates/intro.html',
      controller: 'IntroCtrl'
    })

  $urlRouterProvider.otherwise('/intro');
});
