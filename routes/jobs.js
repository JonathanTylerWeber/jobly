"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - titleLike (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity 
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    try {
        // Extract query parameters
        const { title, minSalary, hasEquity } = req.query;

        // Call the model method with filter parameters
        const jobs = await Job.findAll({ title, minSalary, hasEquity });

        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { title, salary, equity, company_handle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        if (isNaN(req.params.id)) {
            return res.status(404).json({ error: "Job ID must be number" });
        }
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        if (isNaN(req.params.id)) {
            return res.status(404).json({ error: "Job ID must be number" });
        }
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        if ('company_handle' in req.body) {
            throw new BadRequestError("Cannot change company handle");
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        if (isNaN(req.params.id)) {
            return res.status(404).json({ error: "Job ID must be number" });
        }
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;
