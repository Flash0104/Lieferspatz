/**
 * Lieferspatz - Image Lazy Loader
 * Efficiently loads images only when they enter the viewport
 */

(function() {
  'use strict';
  
  // Feature detection for Intersection Observer
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers that don't support Intersection Observer
    console.log('IntersectionObserver not supported, loading all images immediately');
    loadAllImages();
    return;
  }
  
  // Configuration
  const config = {
    rootMargin: '50px 0px', // Start loading images when they're 50px from viewport
    threshold: 0.01 // Trigger when at least 1% of the image is visible
  };
  
  // Create observer
  const observer = new IntersectionObserver(onIntersection, config);
  
  // Elements to observe (all images with data-src attribute)
  const images = document.querySelectorAll('img[data-src]');
  
  // Observe each image
  images.forEach(image => {
    // Add a placeholder preview if none exists
    if (!image.src && !image.classList.contains('lazy-placeholder')) {
      image.src = createPlaceholder(image.width || 300, image.height || 200);
    }
    
    // Start observing the image
    observer.observe(image);
  });
  
  // Handle intersection
  function onIntersection(entries) {
    entries.forEach(entry => {
      // Skip if not intersecting
      if (!entry.isIntersecting) return;
      
      // Stop observing
      observer.unobserve(entry.target);
      
      // Load the image
      loadImage(entry.target);
    });
  }
  
  // Load an image
  function loadImage(image) {
    const src = image.getAttribute('data-src');
    
    if (!src) return;
    
    // Create a new image to preload
    const preloader = new Image();
    
    // Set up handlers before setting src
    preloader.onload = function() {
      // Only replace the image once it's loaded
      image.src = src;
      image.removeAttribute('data-src');
      image.classList.add('loaded');
      image.classList.remove('lazy-placeholder');
    };
    
    preloader.onerror = function() {
      // Show a fallback image on error
      image.src = '/static/images/default_restaurant.jpg';
      image.removeAttribute('data-src');
      image.classList.add('error');
      console.error(`Failed to load image: ${src}`);
    };
    
    // Start loading the image
    preloader.src = src;
  }
  
  // Generate a simple placeholder SVG
  function createPlaceholder(width, height) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle" fill="#9ca3af">Loading...</text>
      </svg>
    `;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  
  // Fallback for browsers without Intersection Observer
  function loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    images.forEach(image => {
      const src = image.getAttribute('data-src');
      if (src) {
        image.src = src;
        image.removeAttribute('data-src');
      }
    });
  }
  
  // Setup dynamic content observers for dynamically added images
  function observeDynamicImages() {
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            // Check if the added node is an Element
            if (node.nodeType === Node.ELEMENT_NODE) {
              // If it's an img with data-src, observe it
              if (node.tagName === 'IMG' && node.hasAttribute('data-src')) {
                observer.observe(node);
              }
              
              // Check its children for img elements
              const childImages = node.querySelectorAll('img[data-src]');
              childImages.forEach(image => {
                observer.observe(image);
              });
            }
          });
        }
      });
    });
    
    // Observe the entire document for added nodes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Initialize dynamic observer after DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDynamicImages);
  } else {
    observeDynamicImages();
  }
})(); 