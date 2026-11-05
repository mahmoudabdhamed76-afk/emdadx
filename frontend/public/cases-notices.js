/* Per-section unread activity. Server totals are monotonic; read positions stay on this device. */
(function (root) {
  'use strict';
  var sections = ['ratings', 'bookings', 'results', 'complaints', 'reports', 'activity', 'qr'];
  function create(options) {
    var totals = {}, read = {}, storage = options.storage, prefix = 'qrd-read:' + options.code + ':';
    function valid(n) { return Number.isSafeInteger(n) && n >= 0; }
    function seen(section) {
      var n = 0;
      try { n = Number(storage.getItem(prefix + section)); } catch (e) {}
      return Math.max(read[section] || 0, valid(n) ? n : 0);
    }
    function unread(section) { return Math.max(0, (totals[section] || 0) - seen(section)); }
    return {
      prefix: prefix,
      total: function (section) { return totals[section] || 0; },
      unread: unread,
      update: function (counts) {
        var changed = [];
        sections.forEach(function (section) {
          var n = counts && counts[section];
          if (valid(n) && n > (totals[section] || 0)) { totals[section] = n; changed.push(section); }
        });
        return changed;
      },
      markRead: function (section) {
        if (sections.indexOf(section) < 0) return;
        read[section] = Math.max(seen(section), totals[section] || 0);
        try { storage.setItem(prefix + section, String(read[section])); } catch (e) {}
      }
    };
  }
  var api = { create: create, sections: sections };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OZNotices = api;
})(typeof window === 'object' ? window : this);
