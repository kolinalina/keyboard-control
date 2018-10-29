var version = 'v1::';

// fungsi callback
self.addEventListener("install", function(event) {
    console.log('WORKER: install event in progress.');
    event.waitUntil(
     
      caches
       
        .open(version + 'fundamentals')
        .then(function(cache) {
         
          return cache.addAll([
            '/',
            '/style.css',
            '/app.js'
          ]);
        })
        .then(function() {
          console.log('WORKER: install completed');
        })
    );
  });

// fungsi fetch
self.addEventListener("fetch", function(event) {
    console.log('WORKER: fetch event in progress.');
  
  
    if (event.request.method !== 'GET') {
     
      console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
      return;
    }
  

    //hijack the respond

    event.respondWith(
      caches
      
        //respons dari cache
        .match(event.request)
        .then(function(cached) {
         
          var networked = fetch(event.request)
            // We handle the network request with success and failure scenarios.
            .then(fetchedFromNetwork, unableToResolve)
            // We should catch errors on the fetchedFromNetwork handler as well.
            .catch(unableToResolve);
  
          /* We return the cached response immediately if there is one, and fall
             back to waiting on the network as usual.
          */
          console.log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);
          return cached || networked;
  
          function fetchedFromNetwork(response) {
            /* We copy the response before replying to the network request.
               This is the response that will be stored on the ServiceWorker cache.
            */
            var cacheCopy = response.clone();
  
            console.log('WORKER: fetch response from network.', event.request.url);
  
            caches
              // We open a cache to store the response for this request.
              .open(version + 'pages')
              .then(function add(cache) {
                /* We store the response for this request. It'll later become
                   available to caches.match(event.request) calls, when looking
                   for cached responses.
                */
                cache.put(event.request, cacheCopy);
              })
              .then(function() {
                console.log('WORKER: fetch response stored in cache.', event.request.url);
              });
  
            // Return the response so that the promise is settled in fulfillment.
            return response;
          }
  
      

          // jika tidak ada match
          function unableToResolve () {
          
  
            console.log('WORKER: fetch request failed in both cache and network.');
  
          

            // construct self response
            return new Response('<h1>Service Unavailable</h1>', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html'
              })
            });
          }
        })
    );
  });

  // menyiapkan funsi activate
  self.addEventListener("activate", function(event) {
    /* Just like with the install event, event.waitUntil blocks activate on a promise.
       Activation will fail unless the promise is fulfilled.
    */
    console.log('WORKER: activate event in progress.');
  
    event.waitUntil(
      caches
        /* This method returns a promise which will resolve to an array of available
           cache keys.
        */
        .keys()
        .then(function (keys) {
          // We return a promise that settles when all outdated caches are deleted.
          return Promise.all(
            keys
              .filter(function (key) {
                // Filter by keys that don't start with the latest version prefix.
                return !key.startsWith(version);
              })
              .map(function (key) {
                /* Return a promise that's fulfilled
                   when each outdated cache is deleted.
                */
                return caches.delete(key);
              })
          );
        })
        .then(function() {
          console.log('WORKER: activate completed.');
        })
    );
  });