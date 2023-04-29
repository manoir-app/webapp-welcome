///<reference path="typings/angular.d.ts" />
///<reference path="typings/manoirApp.d.ts" />
///<reference path="typings/angular-sanitize.d.ts" />
///<reference path="typings/angular-animate.d.ts" />
///<reference path="typings/signalr/index.d.ts" />
var Manoir;
(function (Manoir) {
    var WelcomeApp;
    (function (WelcomeApp) {
        class DefaultPage extends Manoir.Common.ManoirAppPage {
            constructor($scope, $http, $timeout) {
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
            init() {
                try {
                    super.checkLogin(true);
                }
                catch (e) {
                    document.location.reload(true);
                }
                this.connection = new signalR.HubConnectionBuilder()
                    .withUrl("/hubs/1.0/appanddevices")
                    .withAutomaticReconnect()
                    .build();
                var self = this;
                this.connection.on("notifyMeshChange", self.onMeshChange);
                this.connection.on("notifyUserChange", self.notifyUserChange);
            }
            onMeshChange(changeType, mesh) {
                if (changeType == "privacyMode")
                    this.refreshPresence(this.scope, this);
            }
            notifyUserChange(changeType, user) {
                if (changeType == "presence")
                    this.refreshPresence(this.scope, this);
            }
            RefreshData() {
                let self = this;
                let sc = self.scope;
                this.refreshPresence(sc, self);
            }
            refreshPresence(sc, self) {
                let url = "/app/security/api/presence?ts=" + (new Date).getTime();
                fetch(url)
                    .then(res => res.json())
                    .then(json => {
                    sc.currentPresence = json;
                    self.updateUsersFromPresence(sc.allUsers, sc.currentPresence);
                    sc.Loading = false;
                    sc.$applyAsync(function () { });
                });
                url = "/app/security/api/users?ts=" + (new Date).getTime();
                fetch(url)
                    .then(res => res.json())
                    .then(json => {
                    sc.allUsers = json;
                    self.updateUsersFromPresence(sc.allUsers, sc.currentPresence);
                    sc.$applyAsync(function () { });
                });
            }
            updateUsersFromPresence(users, pres) {
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
        WelcomeApp.DefaultPage = DefaultPage;
    })(WelcomeApp = Manoir.WelcomeApp || (Manoir.WelcomeApp = {}));
})(Manoir || (Manoir = {}));
var theApp = angular.module('WelcomeApp', []);
theApp.controller('DefaultPage', Manoir.WelcomeApp.DefaultPage);
theApp.filter('trustAsHtml', function ($sce) {
    return function (html) {
        return $sce.trustAsHtml(html);
    };
});
//# sourceMappingURL=WelcomeApp.js.map