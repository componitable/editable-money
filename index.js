var emitter = require('emitter');
var editable = require('editable');

module.exports = makeEditable;
function makeEditable(elements, options) {
    options = options || {};
    options.encodedSymbol = options.encodedSymbol || '&pound;';
    options.formatNumber = options.formatNumber || format;
    editable.click(elements, function (element) {
        if (element.getAttribute('data-in-edit-mode') == 'true') return;
        element.setAttribute('data-in-edit-mode', 'true');
        edit(element, options);
    });
}
emitter(makeEditable);

function edit(element, options) {
    var dimensions;
    var oldStyle;
    if (options.maintainSize === true) {
        dimensions = editable.dimensions(element);
    }
    emit('pre-begin-edit', element);
    var value = element.textContent.trim().replace(/[^\d\.]/g, '');
    element.innerHTML = [
        '<div class="input-prepend">',
        '<span class="add-on">', options.encodedSymbol, '</span>',
        '<input type="number">',
        '</div>'
    ].join('');
    var edit = element.getElementsByTagName('input')[0];
    edit.value = value;
    if (options.maintainSize === true) {
        var editDimensions = editable.transformDimensions(edit, dimensions);
        edit.style.width = editDimensions.width + 'px';
        edit.style.height = editDimensions.height + 'px';
        oldStyle = {width: element.style.width, height: element.style.height};
        element.style.width = dimensions.width + 'px';
        element.style.height = dimensions.height + 'px';
    }
    edit.focus();
    editable.blur(edit, function () {
        if (element.getAttribute('data-in-edit-mode') != 'true') return;
        var newValue = edit.value.trim().replace(/\,/g, '');
        if (!/^\d*\.?\d?\d?$/g.test(newValue)) {
            setTimeout(function () {
                edit.focus();
            }, 10);
            return;
        }
        element.setAttribute('data-in-edit-mode', 'false');
        emit('pre-end-edit', element);
        element.innerHTML = options.encodedSymbol + options.formatNumber(newValue);
        if (options.maintainSize === true) {
            element.style.width = oldStyle.width;
            element.style.height = oldStyle.height;
        }
        if (value != newValue) {
            emit('update', element, newValue);
        }
        emit('post-end-edit', element);
    });
    emit('post-begin-edit', element);
}

function emit() {
    module.exports.emit.apply(module.exports, arguments);
    editable.emit.apply(editable, arguments);
}

function format(number) {
    number = number.split('.');

    var sections = [];

    var i;
    for (i = number[0].length - 3; i >= 0; i -= 3) {
        sections.push(number[0].substr(i, 3));
    }
    if (i === -1) {
        sections.push(number[0].substr(0, 2));
    }
    if (i == -2) {
        sections.push(number[0].substr(0, 1));
    }
    var revSections = [];
    while (sections.length) {
        revSections.push(sections.pop());
    }
    if (!number[1]) {
      number[1] = '00';
    } else if (number[1].length === 1) {
      number[1] = number[1] + '0';
    }

    return revSections.join(',') + '.' + number[1];
}