(function(document, window) {
  'use strict';
  arc.app.analytics.init();

  let app = document.querySelector('#app');
  app.baseUrl = '/';
  app.pageTitle = '';
  /**
   * Because controllers do not have direct access to the toolbar it must keep relevant data in
   * the main object if it must to be accessible to the toolbar.
   * This is an array of requests related to the currently opened project.
   *
   * TODO:50 In future releases controllers should not keep their data in the toolbar. New design
   * should keep all releted to the controller data in the main workspace window.
   */
  app.projectEndpoints = [];
  /**
   * The same as above.
   */
  app.selectedRequest = null;
  app.addEventListener('dom-change', function() {
    console.log('Our app is ready to rock!');
  });

  // event called when the app is initialized and can remove loader.
  window.addEventListener('ArcInitialized', function() {
    document.querySelector('arc-loader-screen').close();
  });

  window.addEventListener('WebComponentsReady', function() {
    console.log('Components are ready');
    //event will be handled in elements/routing.html
    let event = new Event('initializeRouting');
    window.dispatchEvent(event);
  });

  app.scrollPageToTop = function() {
    app.$.headerPanelMain.scrollToTop(true);
  };

  app.closeDrawer = function() {
    app.$.paperDrawerPanel.closeDrawer();
  };

  // A handler called when data has been imported to the app.
  app._dataImportedHandler = function() {
    app.$.appMenu.refreshProjects();
  };
  /**
   * Open search bar and notify opener about changes.
   */
  app.openSearch = () => {
    var bar = document.querySelector('#search-bar');
    bar.setAttribute('show', true);
    bar.parentNode.setAttribute('mode', 'search');
    var input = document.querySelector('#mainSearchInput');
    var searchFn = function(e) {
      //inform controller about search action
      app._featureCalled('search', e);
      // Array.from(document.querySelectorAll('[search-query]')).forEach((ctrl) => {
      //   if (ctrl.onSearch) {
      //     ctrl.onSearch();
      //   }
      // });
    };
    var blurFn = function(e) {
      let input = document.querySelector('#mainSearchInput');
      input.removeEventListener('blur', blurFn);
      input.removeEventListener('search', searchFn);
      let bar = e.target.parentNode;
      bar.removeAttribute('show', true);
      bar.parentNode.removeAttribute('mode', 'search');
    };

    input.addEventListener('search', searchFn);
    input.addEventListener('blur', blurFn);
    input.focus();
  };

  document.body.addEventListener('page-title-changed', (e) => {
    app.pageTitle = e.detail.title;
  });

  document.body.addEventListener('restore-request', (e) => {
    app.set('request', e.detail.request);
    page('/request/current');
  });

  /**
   * Read more about requesting features in ArcHasToolbarBehavior behavior file.
   * Also change main.css in features section.
   */
  app.featuresMapping = new Map();
  document.body.addEventListener('request-toolbar-features', (e) => {
    app.featuresMapping.clear();
    var list = e.detail.features;
    var bar = document.querySelector('#mainToolbar');
    list.forEach((feature) => {
      bar.setAttribute(feature, true);
      app.featuresMapping.set(feature, e.target);
    });
  });
  document.body.addEventListener('release-toolbar-features', () => {
    var bar = document.querySelector('#mainToolbar');
    var keys = app.featuresMapping.keys();
    for (let feature of keys) {
      bar.removeAttribute(feature);
    }
    app.featuresMapping.clear();
    app.projectEndpoints = [];
  });
  app._featureCalled = (feature, event) => {
    if (!app.featuresMapping.has(feature)) {
      console.warn('Feature "%s" has been called without the mapping', feature);
      return;
    }
    var src = app.featuresMapping.get(feature);
    var name = feature[0].toUpperCase() + feature.substr(1);
    var fnName = 'on' + name;
    if (!(fnName in src)) {
      console.warn(`Function ${fnName} is undefined for ${src.nodeName}`);
    } else {
      src[fnName](event);
    }
  };
  app._onFeatureOpen = (e) => {
    app._featureCalled('open', e);
  };
  app._onFeatureSave = (e) => {
    app._featureCalled('save', e);
  };
  app._onFeatureExport = (e) => {
    app._featureCalled('export', e);
  };
  app._onFeatureClearAll = (e) => {
    app._featureCalled('clearAll', e);
  };
  app._onFeatureProjectEndpoints = (e) => {
    app._featureCalled('projectEndpoints', e.detail.item.dataset.id);
  };
  // called when any component want to change request link.
  document.body.addEventListener('action-link-change', (e) => {
    var url = e.detail.url;
    if (app.request.url && url.indexOf('/') === 0) {
      /* global URLParser */
      let p = new URLParser(app.request.url);
      url = p.protocol + '://' + p.authority + url;
      app.set('request.url', url);
    } else {
      app.set('request.url', url);
    }

  });
  // called when any component want to write to clipboard.
  document.body.addEventListener('clipboard-write', (e) => {
    var data = e.detail.data;
    arc.app.clipboard.write(data);
  });
  document.body.addEventListener('project-saved', () => {
    app.$.appMenu.refreshProjects();
  });

  app.onSave = () => {
    var ctrl = document.querySelector('arc-request-controller');
    ctrl.onSave();
  };

  app.onOpen = () => {
    page('/saved');
  };

  app._cancelEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

})(document, window);
