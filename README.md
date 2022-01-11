# Coriolis computer model

This is a React website hosted at https://coriolis-station.netlify.app. This computer model was created to simulate the Coriolis effects one would see on a spinning space station. I felt this archive should be public to allow greater transparency to the algorithms that run the model. When a person does something mathematical, it is important to show their work!

### The main code files

The code in the src folder is divided into these segments that run the page:

* The main interface/layout is found in App.js.

* The number crunching/math behind the model happens in crunchnumbers.js. This preps the basic facts that are displayed on the screen in the app.

* The logic behind the actual emulation is found in CanvasEarth.js and CanvasSpace.js. This takes the points on the tossed object's path and translates them to a spinning reference frame for display. 
    * These two files parallel each other, but the logic behind earth's gravity vs the spinning gravity is different enough that it was easier for me to keep the files separate. Nonetheless, changing something in one of the files will often require changing the same line in the other file.

* The left input menu is handled in LeftMenu.js. The input fields with the logarithmic sliders are handled in InputField.js. The right "stats" menu is handled in OutputMenu.js. AngleInput.js handles the "angle from vertical" input menu, which is different from the others. PlayBack.js handles the playback speed slider.

### Ideas for future updates

I have a few ideas for potential future improvements to this website.

1. Add a social aspect somewhere?

2. Make a setting to view the throw from an inertial reference frame.

### Tools from Create React App

In the project directory, you can run:

##### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

##### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

##### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
