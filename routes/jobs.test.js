"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 200,
        equity: 0.1,
        company_handle: "c1"
    };

    test("ok for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "new",
                salary: 200,
                equity: "0.1",
                companyHandle: "c1"
            }
        });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 10,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: "hi",
                equity: 0.1,
                company_handle: "c1"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});



/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j1",
                    salary: 100,
                    equity: "0.1",
                    companyHandle: "c1",
                    id: expect.any(Number)
                },
                {
                    title: "j2",
                    salary: 200,
                    equity: "0.1",
                    companyHandle: "c1",
                    id: expect.any(Number)
                },
                {
                    title: "j3",
                    salary: 300,
                    equity: null,
                    companyHandle: "c2",
                    id: expect.any(Number)
                }
            ]
        });
    });

    test("filter by title", async function () {
        const resp = await request(app).get("/jobs?title=j1");
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j1",
                    salary: 100,
                    equity: "0.1",
                    companyHandle: "c1",
                    id: expect.any(Number)
                },
            ],
        });
    });

    test("filter by minSalary", async function () {
        const resp = await request(app).get("/jobs?minSalary=150");
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j2",
                    salary: 200,
                    equity: "0.1",
                    companyHandle: "c1",
                    id: expect.any(Number)
                },
                {
                    title: "j3",
                    salary: 300,
                    equity: null,
                    companyHandle: "c2",
                    id: expect.any(Number)
                }
            ],
        });
    });

    // test("filter by hasEquity", async function () {
    //     const resp = await request(app).get("/jobs?hasEquity");
    //     expect(resp.body).toEqual({
    //         jobs: [
    //             {
    //                 title: "j1",
    //                 salary: 100,
    //                 equity: "0.1",
    //                 companyHandle: "c1",
    //                 id: expect.any(Number)
    //             },
    //             {
    //                 title: "j2",
    //                 salary: 200,
    //                 equity: "0.1",
    //                 companyHandle: "c1",
    //                 id: expect.any(Number)
    //             },
    //         ],
    //     });
    // });

    //     test("filter by name and minEmployees", async function () {
    //         const resp = await request(app).get("/jobs?name=c&minEmployees=2");
    //         expect(resp.body).toEqual({
    //             jobs: [
    //                 {
    //                     handle: "c2",
    //                     name: "C2",
    //                     description: "Desc2",
    //                     numEmployees: 2,
    //                     logoUrl: "http://c2.img",
    //                 },
    //                 {
    //                     handle: "c3",
    //                     name: "C3",
    //                     description: "Desc3",
    //                     numEmployees: 3,
    //                     logoUrl: "http://c3.img",
    //                 },
    //             ],
    //         });
    //     });

});


test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const newJob = {
            title: "new",
            salary: 200,
            equity: 0.1,
            company_handle: "c1"
        };
        const jobRes = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(jobRes.statusCode).toEqual(201);

        const jobId = jobRes.body.job.id;

        const resp = await request(app).get(`/jobs/${jobId}`);
        expect(resp.body).toEqual({
            job: {
                title: "new",
                salary: 200,
                equity: "0.1",
                companyHandle: "c1",
                id: expect.any(Number)
            },
        });
    });

    test("not found for no such company", async function () {
        const resp = await request(app).get(`/jobs/nope`);
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual({ error: "Job ID must be number" });
    });
});

// /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for users", async function () {
        const newJob = {
            title: "new",
            salary: 200,
            equity: 0.1,
            company_handle: "c1"
        };
        const jobRes = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(jobRes.statusCode).toEqual(201);

        const jobId = jobRes.body.job.id;
        const resp = await request(app)
            .patch(`/jobs/${jobId}`)
            .send({
                title: "j1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            job: {
                title: "j1-new",
                salary: 200,
                equity: "0.1",
                companyHandle: "c1",
                id: expect.any(Number)
            },
        });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/c1`)
            .send({
                name: "C1-new",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/nope`)
            .send({
                name: "new nope",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on handle change attempt", async function () {
        const newJob = {
            title: "new",
            salary: 200,
            equity: 0.1,
            company_handle: "c1"
        };
        const jobRes = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(jobRes.statusCode).toEqual(201);

        const jobId = jobRes.body.job.id;
        const resp = await request(app)
            .patch(`/jobs/${jobId}`)
            .send({
                company_handle: "c2",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const newJob = {
            title: "new",
            salary: 200,
            equity: 0.1,
            company_handle: "c1"
        };
        const jobRes = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(jobRes.statusCode).toEqual(201);

        const jobId = jobRes.body.job.id;
        const resp = await request(app)
            .patch(`/jobs/${jobId}`)
            .send({
                salary: "not-a-number",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:handle", function () {
    test("works for users", async function () {
        const newJob = {
            title: "new",
            salary: 200,
            equity: 0.1,
            company_handle: "c1"
        };
        const jobRes = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(jobRes.statusCode).toEqual(201);

        const jobId = jobRes.body.job.id;
        const resp = await request(app)
            .delete(`/jobs/${jobId}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({ deleted: `${jobId}` });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/j1`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/jobs/nope`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
