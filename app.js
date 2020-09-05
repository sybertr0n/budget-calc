  //*******************************************************************************************************//
 //BUDGET CONTROLLER
//*******************************************************************************************************//

var budgetController = (function () {
	
	var Expense = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};

	Expense.prototype.calcPercent = function (totalIncome) {

		if (totalIncome > 0) {
			this.percentage = Math.round((this.value / totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	};

	Expense.prototype.getPercent = function(){
		return this.percentage;
	};

	var Income = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
	};

	var data = {
		allItems: {
			exp: [],
			inc: []
		},
		totals: {
			exp: 0,
			inc: 0
		},
		budget: 0,
		percentage: -1
	};

	var calculateTotal = function (type) {
		
		var sum = 0;

		data.allItems[type].forEach( function(element) {
			sum += element.value;
		});
		data.totals[type] = sum;
	};

	return {
		addItem: function (type, desc, val) {
			var newItem, ID;

			//CREATE NEW ID
			//ID = last ID in array + 1
			if (data.allItems[type].length > 0) {
				ID = data.allItems[type][data.allItems[type].length - 1].id + 1;				
			} else {
				ID = 0;
			}

			//CREATE NEW ITEM BASED ON INC OR EXP
			if (type === "exp") {
				newItem = new Expense(ID, desc, val);
			} else if (type === "inc") {
				newItem = new Income(ID, desc, val);
			}

			//PUSH THE NEWLY CREATED ITEM INTO THE ARRAY
			data.allItems[type].push(newItem);

			//RETURN newItem TO addItem
			return newItem;
		},

		deleteItem: function (type, id) {
			var ids, index;

			ids = data.allItems[type].map(function(elem) {
				return elem.id;
			});

			// console.log(ids);
			index = ids.indexOf(id);

			if (index !== -1) {
				data.allItems[type].splice(index, 1);
			}
		},

		calculateBudget: function () {
			
			//calculate total income and expenses
			calculateTotal('exp');
			calculateTotal('inc');

			//calculate the budget (income - expenses)
			data.budget = data.totals.inc - data.totals.exp;

			//calculate the % of income that we spent
			if (data.totals.inc > 0) {           //to avoid infinity..(anyNo./0 = infinity)
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);				
			} else {
				data.percentage = -1;
			}
		},

		calculatePercentages: function () {

			data.allItems.exp.forEach( function(element) {
				element.calcPercent(data.totals.inc);
			});
		},

		getPercentages: function () {
			
			var allPercents = data.allItems.exp.map(function(elem) {
				return elem.getPercent();
			});
			return allPercents;
		},

		getBudget: function () {
			return {
				budget: data.budget,
				totalInc: data.totals.inc,
				totalExp: data.totals.exp,
				percentage: data.percentage
			};
		},

		testMethod: function () {
			console.log(data);
		}
	};
})();

  //*******************************************************************************************************//
 //UI CONTROLLER
//*******************************************************************************************************//

var UIcontroller = (function () {

	var DOMstrings = {
		inputType: ".add__type",
		inputDescription: ".add__description",
		inputValue: ".add__value",
		inputBtn: ".add__btn",
		incomeContainer:".income__list",
		expenseContainer:".expenses__list",
		budgetLabel: ".budget__value",
		incomeLabel: ".budget__income--value",
		expensesLabel: ".budget__expenses--value",
		container: ".container",
		percentageLabel: ".budget__expenses--percentage",
		expPercentageLabel: ".item__percentage",
		dateLabel: ".budget__title--month"
	};

	var formatNumber = function (num, type) {

		// + or - before no. and 2 deci points and comma separating thousands
		// if inc, no. = + 2,500.00. if exp, then no. = -1,500.00
		var numSplit, int, deci;

		num = Math.abs(num);
		num = num.toFixed(2);

		numSplit = num.split('.');
		int = numSplit[0];

		if (int.length > 3) {
			int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3);  //input 1234, output 1,234
		}

		deci = numSplit[1];			

		return (type === "exp" ? '-' : '+') + " " + int + '.' + deci;
	};

	var nodeListForEach = function (list, callback) {
		for(var i = 0; i < list.length; i++){
			callback(list[i], i);
		}
	};

	return {
		getInput: function () {
			return {
				type: document.querySelector(DOMstrings.inputType).value,     //for income or expense +/- 
				description: document.querySelector(DOMstrings.inputDescription).value,
				value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
			};
		},

		addListItem: function (obj, type) {
			var html, element, newhtml;

			//CREATE A HTML STR WITH PLACEHOLDER TEXT
			if (type === "inc") {
				element = DOMstrings.incomeContainer;
				html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
			} else if (type === "exp") {
				element = DOMstrings.expenseContainer;
				html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
			}

            //REPLACE PLACEHOLDER TEXT WITH ACTUAL DATA
            newhtml = html.replace('%id%', obj.id);
            newhtml = newhtml.replace('%description%', obj.description);
            newhtml = newhtml.replace('%value%', formatNumber(obj.value, type));

			//INSERT THE HTML INTO THE DOM
			//effective than .innerHTML()
			document.querySelector(element).insertAdjacentHTML("beforeend", newhtml); 
		},

		deleteListItem: function (selectorID) {
			var element = document.getElementById(selectorID);

			element.parentNode.removeChild(element);
		},

		clearFields: function () {
			var fields, fieldsArray;
			fields = document.querySelectorAll(DOMstrings.inputDescription + ", " + DOMstrings.inputValue);

			//querySelectorAll() returns all DOMels in a node list (not an array)...below is to convert list to array 
			fieldsArray = Array.prototype.slice.call(fields);
			fieldsArray.forEach( function(element, index, array) {
				element.value = "";
			});
			fieldsArray[0].focus();
		},

		displayBudget: function (obj) {

			var type;
			obj.budget > 0 ? type = 'inc' : type = 'exp';
			
			document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);			
			document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
			document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

			if (obj.percentage > 0) {
				document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
			} else {
				document.querySelector(DOMstrings.percentageLabel).textContent = '--';	
			}
		},

		displayPercentages: function (percentages) {
			
			var fields = document.querySelectorAll(DOMstrings.expPercentageLabel);

			//You can also use .slice() like before
			nodeListForEach(fields, function (current, index) {
				if (percentages[index] > 0) {
					current.textContent = percentages[index] + " %";					
				} else {
					current.textContent = "--";
				}
			});
		},

		displayMonth: function () {

			var now, year, month, monthsArr;

			monthsArr = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];			
			now = new Date();

			month = now.getMonth();
			year = now.getFullYear();
			document.querySelector(DOMstrings.dateLabel).textContent = monthsArr[month] + ", " + year;
		},

		changedType: function () {
			var fields = document.querySelectorAll(
				DOMstrings.inputType + ',' +
				DOMstrings.inputDescription + ',' +
				DOMstrings.inputValue);

			nodeListForEach(fields, function (curr) {
				curr.classList.toggle("red-focus");
			});

			document.querySelector(DOMstrings.inputBtn).classList.toggle("red");
		},

		getDOMstrings: function () {
			return DOMstrings;
		}
	};
})(); 

  //*******************************************************************************************************//
 //GLOBAL APP CONTROLLER (CONTROLLERS CONNECTOR)
//*******************************************************************************************************//

var controller = (function (budgCtrl, UIctrl) {

	var setupEventListeners = function () {
		var DOM = UIctrl.getDOMstrings();
		document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

		document.addEventListener("keypress", function (event) {
			if (event.keyCode === 13 || event.which === 13) {
				ctrlAddItem();
			}
		});

		document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);

		document.querySelector(DOM.inputType).addEventListener("change", UIctrl.changedType);
	};

	var updateBudget = function () {
		//Calculate the budget
		budgCtrl.calculateBudget();

		//method to return the budget
		var budget = budgCtrl.getBudget();

		//Display the budget on the UI
		// console.log(budget)
		UIctrl.displayBudget(budget);
	};

	var updatePercentages = function () {
		
		//Calculate percentages
		budgCtrl.calculatePercentages();

		//Read percentages from the budget controller
		var percentages = budgCtrl.getPercentages();

		//Update the UI with the new percentages
		UIctrl.displayPercentages(percentages);
	};

	var ctrlAddItem = function () {
		var input, newItem;

		//Get Input data
		input = UIctrl.getInput();

		if (input.description !== "" && !isNaN(input.value) && input.value > 0) {

			//Add item to budget controller
			newItem = budgCtrl.addItem(input.type, input.description, input.value);

			//Add item to the UI
			UIctrl.addListItem(newItem, input.type);

			//Clear the Fields
			UIctrl.clearFields();

			//Calculate and display Budget
			updateBudget();

			//Calculate and update percentages
			updatePercentages();
		}	
	};

	var ctrlDeleteItem = function (event) {
		var itemID, splitID, type, ID;
		itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;		
		// console.log(itemID);

		if (itemID) {
			
			//split the string into an array , {for eg., "inc-1".split("-") = ["inc", "1"]}
			splitID = itemID.split("-");
			type = splitID[0];
			ID = parseInt(splitID[1]);

			//Delete the item from the data structure
			budgCtrl.deleteItem(type, ID);

			//Delete the item from the UI
			UIctrl.deleteListItem(itemID);

			//Update and show the new Budget
			updateBudget();

			//Calculate and update percentages
			updatePercentages();
		}
	};

	return {
		init: function () {
			console.log("App Started");
			UIctrl.displayMonth();
			setupEventListeners();
			UIctrl.displayBudget({
				budget: 0,
				totalInc: 0,
				totalExp: 0,
				percentage: -1
			});
		}
	};
})(budgetController, UIcontroller);

controller.init();