# Coriolis computer model

This is a React website hosted at https://coriolis-station.netlify.app. This computer model was created to simulate the Coriolis effects one would see on a spinning space station.

### The main code files

The code in the src folder is divided into these segments that run the page:

* The main interface/layout is found in App.js.

* The number crunching/math behind the model happens in crunchnumbers.js. This preps the basic facts that are displayed on the screen in the app.

* The logic behind the emulation is found in CanvasEarth.js, CanvasSpace.js, and CanvasInertial.js. This takes the points on the tossed object's path and translates them to a reference frame for display.

* The left input menu is handled in LeftMenu.js. The input fields with the logarithmic sliders are handled in InputField.js. The bottom "stats" menu is handled in OutputMenu.js.

### Query variables
The website supports loading with a list of query options:
	?units=feet  (also: imperial, ft, metric, meters, m)
	?diameter=
	?radius=
	?percenttime=  (also: playback=)
	?startheight=
	?percentgravity=
	?speed=
	?angle=
	?thrownUp=  (also: throwHeight=) — calculates speed needed to throw this high on Earth
	?frozen
	?statsMenu
	?inputMenu
	?noPopUp
	?view=earth-inertial  (also: station-inertial; case-insensitive)


### Tools from React Vite

In the project directory, you can run:

##### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

##### `npm run build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

##### npm run preview

This previews the production build locally.