// Map class used to create maps
var Map = function () {
    var self = this;
    var mapView = document.getElementById('map');
    mapView.style.height = window.innerHeight + "px";
    self.mapOptions = {
        center: {lat: 34.196582, lng: 72.043443},
        zoom: 15,
        mapTypeControl: false,
    }
    self.map = new google.maps.Map(mapView, self.mapOptions);
    google.maps.event.addDomListener(window, "resize", function () {
        var center = self.map.getCenter();
        google.maps.event.trigger(self.map, "resize");
        self.map.setCenter(center);
    });
};

function AppVM() {
    var self = this;

    // Map to display markers
    self.map = new Map();

    // Previous marker
    var pMarker;

    self.marker = function (title, subtitle, latitude, longitude, streetAddress) {
        this.title = title;
        this.subtitle = subtitle;
        this.latitude = latitude;
        this.longitude = longitude;
        this.streetAddress = streetAddress;
        this.name = this.title+" - "+this.subtitle;
        this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(this.latitude, this.longitude),
            animation: google.maps.Animation.DROP,
            map: self.map.map
        });
        google.maps.event.addListener(this.marker, 'click', function() {
            self.showInfoWindow(this);
        }.bind(this));
        google.maps.event.addListener(self.map.map, 'click', function() {
            self.infoWindow.close();
            if (pMarker)
                pMarker.setAnimation(null);
        });
    };

    // Data of all the locations
    self.markers = ko.observableArray([
        new self.marker("Pehchan Garments","Clothing Store", 34.1953773, 72.0442508, "Gaju Khan, Mardan"),
        new self.marker("Kababish", "Kebab Restaurant", 34.196365, 72.0393093 , "Bank Rd، Mardan"),
        new self.marker("Abaseen", "Cloth House", 34.197486, 72.0413403, "Shaheen Market, Mardan"),
        new self.marker("Sabdar Hotel", "BBQ Joint", 34.1986247, 72.0278528, "Naway Adda, Mardan"),
        new self.marker("KhoobSurat Stores", "Shopping Plaza", 34.195714, 72.0415676, "Gaju Khan, Mardan"),
    ]);

    // Track on search query
    self.query = ko.observable("");

    // Filter markers
    self.showMarkers = ko.computed(function () {
        return ko.utils.arrayFilter(self.markers(), function (marker) {
            if (marker.name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0)
                return marker.show = true;
            else
                return marker.show = false;
        });
    }, self);

    // Show suggestions list
    self.showList=ko.observable(true);

    // Hide suggestions list
    self.hideList = function () {
        this.showList(false);
    };

    // Display markers based on search query
    self.showMarkers.subscribe(function () {
        self.showList(true);
        for (var i = 0; i < self.markers().length; i++) {
            if (self.markers()[i].show == false)
                self.markers()[i].marker.setVisible(false);
            else
                self.markers()[i].marker.setVisible(true);
        }
    });

    // Creates a infoWindow to show marker info
    self.infoWindow = new google.maps.InfoWindow({});

    // Displaying infowindow with marker info
    self.showInfoWindow = function (marker) {
        if (pMarker)
            pMarker.setAnimation(null);
        pMarker = marker.marker;
        marker.marker.setAnimation(google.maps.Animation.BOUNCE);
        self.infoWindow.setContent('Loading info...');
        self.map.map.setCenter(marker.marker.getPosition());
        self.map.map.panBy(0,-200);
        self.infoWindow.open(self.map.map, marker.marker);
        self.getInfo(marker);
        self.showList(false);
    };

    // GET data from FourSquare API
    self.getInfo = function (marker) {
        var clientId = "D0D3OINQNTAKUWDY5EXXVCTUX4PAWX3OHEM5KOWYXD0GENU5";
        var clientSecret= "V1FRIGRHA41FLXGPTFC50LBBLIPJXGK13LQ4Q4MYF413T0VN";
        var url = "https://api.foursquare.com/v2/venues/search?client_id="+clientId+"&client_secret="+clientSecret+"&v=20130815&ll="+marker.latitude+","+marker.longitude+"&query="+marker.title+"&limit=1";
        $.getJSON(url)
            .done(function (response) {
                response =  response.response.venues[0];
                var html = "<strong>"+ marker.name +"</strong><br>";
                for(var i=0;i<response.location.formattedAddress.length;i++){
                    html+=response.location.formattedAddress[i]+ " ";
                    if(i%2!=0)
                        html+="<br>";
                }
                if(response.location.formattedAddress.length%2!=0)
                    html+="<br>";
                html+= "Number of CheckIns: "+response.stats.checkinsCount+"<br>";
                html+= "Number of Users: "+response.stats.usersCount+"<br>";
                html+= "Verified Place: "+(response.verified ? 'Yes' : 'No')+"<br>";
                if(response.contact.phone)
                    html+="Contact: "+response.contact.phone;
                self.infoWindow.setContent(html);
            })
            .fail(function () {
                self.infoWindow.setContent('Failed to GET data from FourSquare API');
            });
    }
}

// Google Map Success
function googleMapSuccess() {
    ko.applyBindings(new AppVM());
}

// Google Map Error
function googleMapError() {
    document.body.innerHTML = "<center><h5>Failed !!<br> Unable to load Google Maps API</h5></center>";
}