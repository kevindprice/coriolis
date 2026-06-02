import React from 'react';
import leftarrow  from './img/left-arrow.png';
import rightarrow from './img/right-arrow.png';

// Gallery navigation strip shown on narrow screens (≤750 px) where the left
// menu is closed by default.  Mirrors the gallery section in LeftMenu.js.

function GalleryStrip({ leftFunction, rightFunction, showLeft, showRight, text, menu }) {
	return (
		<div id={menu ? undefined : 'main-gallery'} className={menu ? 'menu-gallery' : ''}>
			<img
				src={leftarrow}
				alt="Previous example"
				className={'gallery-arrow' + (showLeft ? '' : ' gallery-arrow-disabled')}
				onClick={showLeft ? leftFunction : undefined}
			/>
			<div id={menu ? undefined : 'main-gallery-text'} style={{color:"white"}} className={menu ? 'menu-gallery-text' : ''}>{text}</div>
			<img
				src={rightarrow}
				alt="Next example"
				className={'gallery-arrow' + (showRight ? '' : ' gallery-arrow-disabled')}
				onClick={showRight ? rightFunction : undefined}
			/>
		</div>
	);
}

export default GalleryStrip;
