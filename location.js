angular.module('trelloApp', [])
  .controller('trelloCtrl', [ "$scope", function($scope) {
        $scope.isLoading = true;
        $scope.exportReady = false;
       
        $scope.actionsList = [];
        $scope.allList = [];
        $scope.displayList = [];
        
        $scope.filter = { pageIndex: 0, pageSize: 20 };
       
        $scope.authenticationSuccess = function(result) {
            console.log('Successful authentication');
            
            Trello.get('boards/' + "566546901ef0f16106da4cec" + '?actions=commentCard,updateCard:idList', $scope.onBoardsLoad());
        };
        
        $scope.authenticationFailure = function() { alert('Authentication failed'); console.log('Failed authentication'); };
        
        $scope.onBoardsLoad = function() {
            return function(response) {
                $scope.allActions = response.actions;
                $scope.loadActions();
            }
        };
        
        $scope.loadActions = function() {
            //reset all data
            $scope.actionsList = [];
            $scope.displayList = [];
            
            $scope.filter = { pageIndex: 0, pageSize: 20 };
            
            $scope.exportReady = false;
            $scope.isLoading = true;
            
            for(var i = 0; i < $scope.allActions.length; i++) {
                var item = $scope.allActions[i];
                
                if(item.type === 'updateCard') {
                    item.listFrom = item.data.listBefore.name;
                    item.listTo = item.data.listAfter.name;
                } else {
                    item.details = item.data.text;
                }
                
                if(i < $scope.filter.pageSize) {
                    $scope.displayList.push(item);
                }
                
                $scope.actionsList.push(item);
            }
            
            $scope.exportReady = true;
            $scope.isLoading = false;
            
            $scope.$apply();
        };
        
        $scope.loadMore = function() {
            $scope.isLoading = true;
            
            $scope.filter.pageIndex++;
            
            var startCount = $scope.filter.pageIndex * $scope.filter.pageSize;
            var endCount = ($scope.filter.pageIndex + 1) * $scope.filter.pageSize;
            endCount = $scope.actionsList.length > endCount ? endCount : $scope.actionsList.length;
            
            for(var i = startCount; i < endCount; i++) {
                var item = $scope.allActions[i];
                
                if(item.type === 'updateCard') {
                    item.listFrom = item.data.listBefore.name;
                    item.listTo = item.data.listAfter.name;
                } else {
                    item.details = item.data.text;
                }
                
                $scope.displayList.push(item);
            }
            
            $scope.isLoading = false;
        };
        
        Trello.authorize({
            type: 'popup',
            name: 'Getting Started Application',
            scope: {
                read: true,
                write: false 
            },
            expiration: 'never',
            success: $scope.authenticationSuccess,
            error: $scope.authenticationFailure
        });   
  }]);