/**
 * Linear interpolation function for animation.
 * @param {number} pct
 * @param {number} v0
 * @param {number} v1
 * @return {number}
 */
export function lerp(pct, v0, v1) {
    return v0 * (1 - pct) + v1 * pct;
  }
  
  /**
   * Ease out quad for animation.
   * @param {number} t
   * @return {number}
   */
  export function easeOutQuad(t) {
    return --t * t * t + 1;
  }

  
  import { cardMargin, cards, lightboxEl, player, setCardMargin, setCards, setCardWidth } from "./globals.js";
import { resetStyles } from './swipe-down-to-close.js';

/**
 * Initializes listeners for cards, including showing the lightbox on click
 * and showing/hiding the background cards on hover.
 */
export function initializeCards() {
  lightboxEl.addEventListener('click', () => {
    document.body.classList.toggle('lightbox-open');
  });

  setCards(document.querySelectorAll('.entry-point-card-container'));
  setCardMargin(parseFloat(getComputedStyle(cards[0]).marginRight))
  setCardWidth(cardMargin + cards[0].offsetWidth)

  const stories = player.getStories();

  cards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      player.show(stories[idx].href, /* pageId */ null, {animate: false});
      document.body.classList.toggle('lightbox-open');
      lightboxEl.classList.remove('closed');
      card.classList.add('hidden');

      resetStyles();
      player.play();
    });

    card.addEventListener('mouseenter', () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) return;
      showBackgroundCards(idx);
    });

    card.addEventListener('mouseleave', () => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) return;
      hideBackgroundCards(idx);
    });
  });
}

/**
 * Displays background cards on hover and pushes next cards.
 */
function showBackgroundCards(idx) {
  for (let i = idx + 1; i < cards.length; i++) {
    const savedTransform = cards[i].style.transform;
    const translateX = parseFloat(savedTransform.replace(/[^-?\d.]/g, '')) || 0;

    cards[i].style['transform'] = `translateX(${translateX + 24}px)`;
  }
}

/**
 * Hides background cards and resets next siblings to original position.
 */
function hideBackgroundCards(idx) {
  for (let i = idx + 1; i < cards.length; i++) {
    const savedTransform = cards[i].style.transform;
    const translateX = parseFloat(savedTransform.replace(/[^-?\d.]/g, '')) || 0;

    cards[i].style['transform'] = `translateX(${translateX - 24}px)`;
  }
}


export let cards;
export let cardMargin;
export let cardWidth;

export let player;
export let lightboxEl;

export function setPlayer(playerEl) {
  player = playerEl;
}

export function setLightbox(lightbox) {
  lightboxEl = lightbox;
}

export function setCards(cardEls) {
  cards = cardEls;
}

export function setCardWidth(width) {
  cardWidth = width;
}

export function setCardMargin(margin) {
  cardMargin = margin;
}

/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { cardMargin, cards, cardWidth } from "./globals.js";

let leftArrow;
let rightArrow;
let scrollX = 0;
let maxScroll;

/**
 * Initializes arrows for horizontal scrolling on desktop.
 */
export function initializeArrows() {
  const scrollContainer = document.querySelector('.carousel-cards-container');
  const containerPadding =
    parseFloat(getComputedStyle(scrollContainer.firstElementChild).paddingLeft) +
    parseFloat(getComputedStyle(scrollContainer.firstElementChild).paddingRight);

  leftArrow = document.querySelector('.entry-point-left-arrow');
  rightArrow = document.querySelector('.entry-point-right-arrow');

  maxScroll =
    scrollContainer.offsetWidth -
    containerPadding +
    cardMargin -
    cards.length * cardWidth;

  if (maxScroll >= 0) {
    return;
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  rightArrow.classList.toggle('visible', !isMobile);

  const carousel = document.querySelector('.carousel-container');
  carousel.classList.toggle('overflow-right', true);

  addArrowListener(leftArrow, true);
  addArrowListener(rightArrow);
}

/**
 * Adds click listeners to scrolling arrows.
 * @param {!Element} button
 * @param {boolean} isLeft
 */
function addArrowListener(button, isLeft = false) {
  const carousel = document.querySelector('.carousel-container');
  button.addEventListener('click', () => {
    scrollX = isLeft
      ? Math.min(0, scrollX + cardWidth * 2)
      : Math.max(maxScroll, scrollX - cardWidth * 2);

    cards.forEach((card) => {
      card.style['transform'] = `translateX(${scrollX}px)`;
    });

        carousel.classList.toggle('overflow-left', scrollX < 0);
    carousel.classList.toggle('overflow-right', scrollX > maxScroll);

    leftArrow.classList.toggle('visible', scrollX < 0);
    rightArrow.classList.toggle('visible', scrollX > maxScroll);
  });
}


/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import { cards, lightboxEl, player } from "./globals.js";
import { easeOutQuad, lerp } from "./utils/math.js";

let scaleVal = 1;
let scalingDown = false;
const toggleThresholdPx = 60;
let deltaY = 0;
let isSwipeY = null;
let touchStartX = 0;
let touchStartY = 0;

/**
 * Initializes listeners.
 */
 export function initializeTouchListeners() {
  player.addEventListener('amp-story-player-touchstart', (event) => {
    onTouchStart(event);
  });

  player.addEventListener('amp-story-player-touchmove', (event) => {
    onTouchMove(event);
  });

  player.addEventListener('amp-story-player-touchend', (event) => {
    onTouchEnd(event);
  });
}

/**
 * Closes the player from the lightbox experience.
 */
 function closePlayer() {
  player.pause();
  document.body.classList.toggle('lightbox-open', false);
  lightboxEl.classList.add('closed');
  cards.forEach((card) => {
    card.classList.remove('hidden');
  });
}

/**
 * Handles onTouchStart events.
 * @param {!Event} event
 */
 function onTouchStart(event) {
  lightboxEl.classList.add('dragging');
  touchStartX = event.detail.touches[0].screenX;
  touchStartY = event.detail.touches[0].screenY;
}

/**
 * Handles onTouchMove events.
 * @param {!Event} event
 */
function onTouchMove(event) {
  const {screenX, screenY} = event.detail.touches[0];

  if (isSwipeY === null) {
    isSwipeY =
      Math.abs(touchStartY - screenY) > Math.abs(touchStartX - screenX);
  }

  if (isSwipeY === false) {
    return;
  }

  deltaY = touchStartY - screenY;

  if (deltaY > 0) {
    // Swiping up.
    return;
  }

  if (!scalingDown) {
    // Set flag so loop doesn't kick off again while it's running.
    scalingDown = true;
    // Start of animate scale.
    animateScale(0);
  }

  isSwipeY = true;
  lightboxEl.style.transform = `translate3d(0, ${Math.pow(
    -deltaY,
    0.6
  )}px, 0) scale3d(${scaleVal}, ${scaleVal}, 1)`;
}

/**
 * Handles onTouchEnd events.
 */
function onTouchEnd() {
  resetAnimationScale();

  lightboxEl.classList.remove('dragging');
  if (isSwipeY === true && Math.abs(deltaY) > toggleThresholdPx) {
    closePlayer();
  } else if (isSwipeY === true) {
    resetStyles();
  }
  isSwipeY = null;
}

/**
 * Animates scale for swipe down.
 * @param {number} val
 */
function animateScale(val) {
  if (val < 1 && scalingDown) {
    scaleVal = lerp(easeOutQuad(val), 1, 0.95);
    lightboxEl.style.transform = `translate3d(0px, ${Math.pow(
      -deltaY,
      0.6
    )}px, 0) scale3d(${scaleVal}, ${scaleVal}, 1)`;
    requestAnimationFrame(() => animateScale((val += 0.05)));
  }
}

/**
 * Resets animation scale.
 */
function resetAnimationScale() {
  scalingDown = false;
  scaleVal = 1;
}

/**
 * Resets styles of the lightbox animation.
 */
export function resetStyles() {
  lightboxEl.style.transform = `translate3d(0, 0, 0) scale3d(1, 1, 1)`;
}
