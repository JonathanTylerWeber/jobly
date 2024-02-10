const { sqlForPartialUpdate } = require('./sql');

describe('sqlForPartialUpdate', () => {
    test('should generate SQL SET clause and parameter values correctly', () => {
        // Test data
        const dataToUpdate = {
            firstName: 'John',
            age: 30,
        };
        const jsToSql = {
            firstName: 'first_name',
            age: 'age',
        };

        // Expected result
        const expectedSetCols = '"first_name"=$1, "age"=$2';
        const expectedValues = ['John', 30];

        // Call the function
        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

        // Assert the results
        expect(setCols).toBe(expectedSetCols);
        expect(values).toEqual(expectedValues);
    });

    // Add more test cases as needed...
});
