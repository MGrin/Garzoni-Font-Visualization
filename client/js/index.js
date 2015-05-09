var visual;
var DataHandler = new DataController();
var Statistics;

$(document).ready(function () {
  visual = new Visual();

  move.select = function(selector){
    return $(selector).get(0);
  };

  $('#buttons > #use').click(function () {
    visual.landing.hide();
    visual.loading.show();
    DataHandler.loadData(function (statisticsObj) {
      visual.loading.hide();
      Statistics = statisticsObj;
      visual.dashboard.init(Statistics);
      visual.dashboard.show();
    }, function (err) {
      visual.loading.hide();
      alert(err);
      visual.landing.show();
    });
  });

  $('body').css('height', $(window).height());
  visual.landing.show();
});