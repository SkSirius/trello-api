angular.module('trelloApp', [])
  .controller('trelloCtrl', [ "$scope", function($scope) {
        $scope.listId = '';
        $scope.boardId = '539700d34fe4ae99ee15e84f';
        $scope.isLoading = true;
        $scope.boardList = [];
        $scope.cardList = [];
        $scope.displayList = [];
        $scope.filter = { pageIndex: 0, pageSize: 20 };
        $scope.selectedItem = {};
        $scope.foundResolved = false;
        $scope.columnText = 'Active Time';
        $scope.exportReady = false;
        
        $scope.authenticationSuccess = function(result) {
            console.log('Successful authentication');
            Trello.get('boards/' + $scope.boardId + '?lists=all', $scope.onBoardsLoad());
        };
        
        $scope.authenticationFailure = function() { alert('Authentication failed'); console.log('Failed authentication'); };
        
        $scope.onBoardsLoad = function() {
            return function(response) {
                $scope.boardList = response.lists;
                $scope.listId = $scope.boardList[0].id;
                $scope.selectedItem = $scope.boardList[0];
                
                Trello.get("lists/" + $scope.listId + "/cards/open", function(response) {
                    $scope.cardList = response;
                    $scope.loadCardsData();
                    
                    $scope.loadAllIntoHidden();
                });    
            }
        }
        
        $scope.loadCardsData = function() {
            $scope.isLoading = true;
            
            var startCount = $scope.filter.pageIndex * $scope.filter.pageSize;
            var endCount = ($scope.filter.pageIndex + 1) * $scope.filter.pageSize;
            endCount = $scope.cardList.length > endCount ? endCount : $scope.cardList.length;
            
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
        
        $scope.loadAllIntoHidden = function() {
            $scope.exportReady = false;
            for(var i = 0; i < $scope.cardList.length; i++) {
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
            setTimeout(function() { $scope.exportReady = true; $scope.$apply(); }, 3000);
        }
        
        $scope.onGetCardInfo = function(card) {
            return function(response) {
                Trello.cards.get(card.id + "/actions?filter=updateCard:idList", $scope.onGetCardsActions(card));
            }
        };
        
        
        
        $scope.dateDiff = function(a, b) {
            var date1 = a;
            var date2 = b;

            var diff = date2.getTime() - date1.getTime();

            var days = Math.floor(diff / (1000 * 60 * 60 * 24));
            diff -=  days * (1000 * 60 * 60 * 24);

            var hours = Math.floor(diff / (1000 * 60 * 60));
            diff -= hours * (1000 * 60 * 60);

            var mins = Math.floor(diff / (1000 * 60));
            diff -= mins * (1000 * 60);

            var seconds = Math.floor(diff / (1000));
            diff -= seconds * (1000);

            var result = "";
            
            if(days > 0) result += days + " day(s), "; 
            if(hours > 0) result += hours + " hour(s), ";
            if(mins > 0) result += mins + " minute(s), ";
            result += seconds + " seconds";  
            
            return result;
        }
        
        $scope.onGetCardsActions = function(card) {
            return function(actions) {
                var createdDate = new Date(1000*parseInt(card.id.substring(0,8),16));
                card.dateCreated =  createdDate.toDateString(); 
                card.dateResolved = new Date();
                for(var i = actions.length - 1; i >=0; i--) {
                    if(actions[i].data.listAfter.name.toLowerCase().indexOf("resolved") > -1) {
                        var resolvedDate = new Date(actions[i].date);
                        card.dateResolved = resolvedDate.toDateString();
                        
                        card.resolveTime = $scope.dateDiff(createdDate, resolvedDate);
                        $scope.foundResolved = true;
                        $scope.columnText = "Resolved Time";
                        break;
                    }
                }
                
                if(!$scope.foundResolved) {
                    $scope.columnText = 'Time Active';
                    card.resolveTime = $scope.dateDiff(createdDate, new Date());
                    card.dateResolved = '';
                }
            }
        };
        
        $scope.loadNewList = function() {
            $scope.cardList = [];
            $scope.displayList = [];
            $scope.filter = { pageIndex: 0, pageSize: 20 };
            $scope.foundResolved = false;
            
            $scope.isLoading = true;
            
            Trello.get("lists/" + $scope.selectedItem.id + "/cards/open", function(response) {
                $scope.isLoading = false;
                $scope.cardList = response;
                $scope.loadCardsData();
            }); 
        }
        
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