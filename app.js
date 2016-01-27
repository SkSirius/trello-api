angular.module('trelloApp', [])
  .controller('trelloCtrl', [ "$scope", function($scope) {
        $scope.listId = '53970114999c7fbf957553f6';
        $scope.isLoading = true;
        $scope.cardList = [];
        $scope.displayList = [];
        $scope.filter = { pageIndex: 0, pageSize: 20 };
        
        $scope.authenticationSuccess = function(result) {
            console.log('Successful authentication');
        
            Trello.get("lists/" + $scope.listId + "/cards/open", function(response) {
                $scope.cardList = response;
                $scope.loadCardsData();
            });    
        };
        
        $scope.authenticationFailure = function() { alert('Authentication failed'); console.log('Failed authentication'); };
        
        $scope.loadCardsData = function() {
            $scope.isLoading = true;
            
            var startCount = $scope.filter.pageIndex * $scope.filter.pageSize;
            var endCount = ($scope.filter.pageIndex + 1) * $scope.filter.pageSize;
            for(var i = startCount; i < endCount; i++) {
                $scope.displayList.push($scope.cardList[i]);
                var cardItem = $scope.cardList[i];
                
                Trello.cards.get(cardItem.id, $scope.onGetCardInfo(cardItem));
                
                cardItem.checkLists = [];
                for(var j = 0; j < cardItem.idChecklists.length; j++) {
                    Trello.checklists.get(cardItem.idChecklists[j], $scope.onGetCheckListInfo(cardItem));
                }
                
                cardItem.memberList = [];
                for(var m = 0; m < cardItem.idMembers.length; m++) {
                    Trello.members.get(cardItem.idMembers[m], $scope.onGetMemberInfo(cardItem));
                }
            }
            
            $scope.isLoading = false; 
            setTimeout(function() { $scope.$apply(); }, 3000);
           
        };
        
        $scope.onGetCardInfo = function(card) {
            return function(response) {
                Trello.cards.get(card.id + "/actions?filter=updateCard:idList", $scope.onGetCardsActions(card));
            }
        };
        
        $scope.onGetCardsActions = function(card) {
            return function(actions) {
                card.dateCreated =  new Date(1000*parseInt(card.id.substring(0,8),16)).toDateString(); 
                card.dateResolved = new Date();
                for(var i = actions.length - 1; i >=0; i--) {
                    if(actions[i].data.listAfter.name === "Resolved") {
                        card.dateResolved = new Date(actions[i].date).toDateString();
                        break;
                    }
                }
            }
        };
        
        $scope.onGetCheckListInfo = function(card) {
            return function(list) {
                card.checkLists.push(list);
            }
        };
        
        $scope.onGetMemberInfo = function(card) {
            return function(member) {
                card.memberList.push(member);
            }
        };
        
        $scope.loadMore = function() {
            $scope.filter.pageIndex++;
            $scope.loadCardsData(); 
        };
        
        $scope.refresh = function() { $scope.apply(); };
        
        $scope.getLabelClass = function(color) {
            switch(color) {
                case 'blue': return "bck-blue";
                case 'red': return "bck-red";
                case 'yellow': return "bck-yellow";
                default: return "bck-gray";
            }
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