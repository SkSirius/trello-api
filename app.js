angular.module('trelloApp', [])
  .controller('trelloCtrl', [ "$scope", function($scope) {
        $scope.listId = '';
        $scope.isLoading = true;
        $scope.orgBoards = [];
        $scope.boardList = [];
        $scope.cardList = [];
        $scope.allList = [];
        $scope.displayList = [];
        $scope.memberList = [];
        $scope.labelList = [];
        $scope.filter = { pageIndex: 0, pageSize: 20 };
        $scope.selectedItem = {};
        $scope.selectedMember = {};
        $scope.selectedLabel = {};
        $scope.selectedBoard = {};
        $scope.foundResolved = false;
        $scope.columnText = 'Active Time';
        $scope.exportReady = false;
        
        $scope.authenticationSuccess = function(result) {
            console.log('Successful authentication');
            $scope.onOrganizationLoad();
        };
        
        $scope.authenticationFailure = function() { alert('Authentication failed'); console.log('Failed authentication'); };
        
        $scope.onOrganizationLoad = function() {
            Trello.get('members/me/boards?filter=open', function(response) {
               $scope.orgBoards = response;
               $scope.selectedBoard = $scope.orgBoards[0];
               
               Trello.get('boards/' + $scope.selectedBoard.id + '?lists=all', $scope.onBoardsLoad());
            });
        };
        
        $scope.loadNewBoards = function() {
            Trello.get('boards/' + $scope.selectedBoard.id + '?lists=all', $scope.onBoardsLoad());
        };
        
        $scope.onBoardsLoad = function() {
            return function(response) {
                $scope.boardList = response.lists;
                $scope.listId = $scope.boardList[0].id;
                $scope.selectedItem = $scope.boardList[0];
                
                $scope.loadNewList();
            }
        };
        
        $scope.loadCards = function() {
            Trello.get("lists/" + $scope.selectedItem.id + "/cards?&fields=badges,labels,name&members=true&checklists=all&member_fields=username&limit=1000&filter=open&actions=commentCard,updateCard:idList", function(response) {
                $scope.cardList = response;
                $scope.allList = response;
                $scope.loadCardsData();
                
                if($scope.selectedItem.name.toLowerCase().indexOf("resolved") > -1) {
                    $scope.foundResolved = true;
                    $scope.columnText = "Resolved Time";
                } else {
                    $scope.columnText = 'Time Active';
                }
                
                $scope.loadAllIntoHidden();
                
                $scope.$apply();
            }, function(err) {
                console.error(err);
            });    
        };
        
        $scope.loadCardsData = function() {
            $scope.isLoading = true;
            
            var startCount = $scope.filter.pageIndex * $scope.filter.pageSize;
            var endCount = ($scope.filter.pageIndex + 1) * $scope.filter.pageSize;
            endCount = $scope.cardList.length > endCount ? endCount : $scope.cardList.length;
            
            for(var i = startCount; i < endCount; i++) {
                $scope.displayList.push($scope.cardList[i]);
                $scope.onGetCardsActions($scope.displayList[i]);
            }
            
            $scope.isLoading = false;
           
        };
        
        $scope.loadAllIntoHidden = function() {
            $scope.exportReady = false;
            
            $scope.labelList = [];
            $scope.labelList.push('None');
            $scope.memberList = [];
            $scope.memberList.push('None');
            
            for(var i = 0; i < $scope.cardList.length; i++) {
                $scope.onGetCardsActions($scope.cardList[i]);
                
                $scope.labelFilter($scope.cardList[i].labels);
                $scope.memberFilter($scope.cardList[i].members);
            }
            
            $scope.exportReady = true;
        };
        
        $scope.labelFilter = function(labels) {
            for(var i = 0; i < labels.length; i++) {
                if($scope.labelList.indexOf(labels[i].name) == -1) {
                    $scope.labelList.push(labels[i].name);
                }
            }
        };
        
        $scope.memberFilter = function(members) {
            for(var i = 0; i < members.length; i++) {
                if($scope.memberList.indexOf(members[i].username) == -1) {
                    $scope.memberList.push(members[i].username);
                }
            }
        };
        
        $scope.filteredList = function(num) {
            var member = $scope.selectedMember;
            var label = $scope.selectedLabel;
            
            var tempList = $scope.allList;
            if(typeof member === 'string' && member != "None") {
                tempList = _.filter(tempList, function(item) {
                    for(var i = 0; i < item.members.length; i++) {
                        if(item.members[i].username === member) {
                            return true;
                        }
                    }
                });
            }
            
            if(typeof label === 'string' && label != "None") {
                tempList = _.filter(tempList, function(item) {
                    for(var i = 0; i < item.labels.length; i++) {
                        if(item.labels[i].name === label) {
                            return true;
                        }
                    }
                });
            }
            
            $scope.displayList = [];
            $scope.cardList = tempList;
            var length = $scope.cardList.length > 20 ? 20 : $scope.cardList.length;
            
            for(var i = 0; i < length; i++) {
                $scope.displayList.push($scope.cardList[i]);
            }
        }
        
        $scope.onGetCardsActions = function(card) {
            var createdDate = new Date(1000*parseInt(card.id.substring(0,8),16));
            card.dateCreated =  createdDate; 
            card.dateResolved = new Date();
            card.commentList = [];
            
            var actions = card.actions;
            
            for(var i = actions.length - 1; i >=0; i--) {
                
                if(actions[i].type === "updateCard") {
                    if(actions[i].data.listAfter.name.toLowerCase().indexOf("resolved") > -1) {
                        var resolvedDate = new Date(actions[i].date);
                        card.dateResolved = resolvedDate;
                        
                        card.resolveTime = $scope.dateDiff(createdDate, resolvedDate);
                        break;
                    }
                } else {
                    card.commentList.push( actions[i].memberCreator.fullName + ": " + actions[i].data.text);
                }
            }
            
            if(!$scope.foundResolved) {
                card.resolveTime = $scope.dateDiff(createdDate, new Date());
                card.dateResolved = '';
            }
        };
        
        $scope.loadNewList = function() {
            //reset all data
            $scope.cardList = [];
            $scope.displayList = [];
            $scope.filter = { pageIndex: 0, pageSize: 20 };
            $scope.foundResolved = false;
            $scope.exportReady = false;
            $scope.isLoading = true;
            //reload cards
            $scope.loadCards();
        };
        
        $scope.loadMore = function() {
            $scope.filter.pageIndex++;
            $scope.loadCardsData(); 
        };
        
        $scope.getLabelClass = function(color) {
            switch(color) {
                case 'blue': return "bck-blue";
                case 'red': return "bck-red";
                case 'yellow': return "bck-yellow";
                default: return "bck-gray";
            }
        };
    
        $scope.dateDiff = function(a, b) {
            var diff = b.getTime() - a.getTime();
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