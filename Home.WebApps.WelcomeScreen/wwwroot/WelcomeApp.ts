///<reference path="typings/angular.d.ts" />
///<reference path="typings/manoirApp.d.ts" />
///<reference path="typings/angular-sanitize.d.ts" />
///<reference path="typings/angular-animate.d.ts" />
///<reference path="typings/signalr/index.d.ts" />

module Manoir.WelcomeApp {

    interface IDefaultPageScope extends ng.IScope {
        Loading: boolean;


        currentPresence: Presence;
        allUsers: User[];
    }


    interface User {
        id: string;
        firstName: string;
        name: string;
        avatar: UserImage;

        alreadyPresent: boolean;
    }
    interface UserImage {
        urlSquareSmall: string;
    }

    interface UserPresent {
        userId: string;
        userFirstName: string;
        userName: string;
        imageUrl: string;
    }

    interface Presence {
        mainUsers: UserPresent[];
        guests: UserPresent[];
        privacyModeActivated: boolean;
    }

    export class DefaultPage extends Manoir.Common.ManoirAppPage {
        connection: signalR.HubConnection;
        scope: IDefaultPageScope;
        $timeout: ng.ITimeoutService;
        http: any;
        constructor($scope: IDefaultPageScope, $http: any, $timeout: ng.ITimeoutService) {
            super();
            this.scope = $scope;
            this.http = $http;
            this.$timeout = $timeout;
            this.scope.Events = this;
            this.scope.Loading = true;
            this.init();
            let self = this;
            this.RefreshData();
            setInterval(function () { self.RefreshData(); }, 5000);
        }

        private init() {

            try {
                super.checkLogin(true);
            }
            catch (e) {
                (document.location as any).reload(true);
            }

            this.connection = new signalR.HubConnectionBuilder()
                .withUrl("/hubs/1.0/appanddevices")
                .withAutomaticReconnect()
                .build();

            var self = this;

            this.connection.on("notifyMeshChange", self.onMeshChange);
            this.connection.on("notifyUserChange", self.notifyUserChange);
            
        }

        private onMeshChange(changeType: string, mesh: any): void {
            if (changeType == "privacyMode")
                this.refreshPresence(this.scope, this);
        }

        private notifyUserChange(changeType: string, user: any): void {
            if (changeType == "presence")
                this.refreshPresence(this.scope, this);
        }

        public RefreshData(): void {
            let self = this;
            let sc = self.scope;

            this.refreshPresence(sc, self);
        }

        private refreshPresence(sc: IDefaultPageScope, self: DefaultPage) {
            let url = "/app/security/api/presence?ts=" + (new Date).getTime();

            fetch(url)
                .then(res => res.json())
                .then(json => {
                    sc.currentPresence = json;
                    self.updateUsersFromPresence(sc.allUsers, sc.currentPresence);
                    sc.Loading = false;
                    sc.$applyAsync(function() { });
                });

            url = "/app/security/api/users?ts=" + (new Date).getTime();
            fetch(url)
                .then(res => res.json())
                .then(json => {
                    sc.allUsers = json;
                    self.updateUsersFromPresence(sc.allUsers, sc.currentPresence);
                    sc.$applyAsync(function() { });
                });
        }

        private updateUsersFromPresence(users: Array<User>, pres: Presence) {
            if (users == null || pres == null)
                return;
            for (var i = 0; i < users.length; i++) {
                var found = false;
                for (var p = 0; p < pres.mainUsers.length; p++) {
                    if (users[i].id == pres.mainUsers[p].userId)
                        found = true;
                }
                for (var p = 0; p < pres.guests.length; p++) {
                    if (users[i].id == pres.guests[p].userId)
                        found = true;
                }
                users[i].alreadyPresent = found;
            }
        }


    }
}

var theApp = angular.module('WelcomeApp', []);

theApp.controller('DefaultPage', Manoir.WelcomeApp.DefaultPage);
theApp.filter('trustAsHtml', function ($sce) {
    return function (html) {
        return $sce.trustAsHtml(html);
    }
});
